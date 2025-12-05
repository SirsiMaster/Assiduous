package billing

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"os"
	"time"

	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/client"
)

// Service wraps Stripe client and SQL access for subscription billing.
type Service struct {
	Stripe *client.API
	DB     *sql.DB
}

// NewService constructs a Service using STRIPE_API_KEY from environment.
func NewService(db *sql.DB) (*Service, error) {
	key := os.Getenv("STRIPE_API_KEY")
	if key == "" {
		return nil, errors.New("STRIPE_API_KEY is not configured")
	}

	sc := &client.API{}
	sc.Init(key, nil)

	return &Service{Stripe: sc, DB: db}, nil
}

// EnsureCustomer ensures there is a Stripe customer for the given Firebase UID.
// It returns the Stripe customer ID (creating one if necessary) and persists it to stripe_customers.
func (s *Service) EnsureCustomer(ctx context.Context, firebaseUID, email string) (string, error) {
	var existingCustomerID string
	// Look up existing mapping.
	err := s.DB.QueryRowContext(ctx,
		"SELECT customer_id FROM stripe_customers WHERE firebase_uid = $1",
		firebaseUID,
	).Scan(&existingCustomerID)

	switch {
	case err == sql.ErrNoRows:
		// Create new Stripe customer.
		params := &stripe.CustomerParams{
			Email: stripe.String(email),
			Metadata: map[string]string{
				"firebase_uid": firebaseUID,
			},
		}

		cust, cerr := s.Stripe.Customers.New(params)
		if cerr != nil {
			return "", cerr
		}

		if _, ierr := s.DB.ExecContext(ctx,
			"INSERT INTO stripe_customers (firebase_uid, customer_id) VALUES ($1, $2)",
			firebaseUID, cust.ID,
		); ierr != nil {
			return "", ierr
		}

		return cust.ID, nil

	case err != nil:
		return "", err

	default:
		return existingCustomerID, nil
	}
}

// CreateCheckoutSession creates a Stripe Checkout Session for a subscription plan.
// planPriceID is the Stripe Price ID representing the subscription plan.
// firebaseUID is stored in subscription metadata so webhook processing can
// associate subscriptions back to users.
func (s *Service) CreateCheckoutSession(ctx context.Context, firebaseUID, customerID, planPriceID, successURL, cancelURL string) (string, error) {
	params := &stripe.CheckoutSessionParams{
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		Customer:   stripe.String(customerID),
		SuccessURL: stripe.String(successURL),
		CancelURL:  stripe.String(cancelURL),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(planPriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			Metadata: map[string]string{
				"firebase_uid": firebaseUID,
			},
		},
	}

	session, err := s.Stripe.CheckoutSessions.New(params)
	if err != nil {
		return "", err
	}
	return session.URL, nil
}

// UpsertSubscriptionFromEvent persists subscription state from a Stripe Subscription object.
func (s *Service) UpsertSubscriptionFromEvent(ctx context.Context, sub *stripe.Subscription) error {
	if sub == nil {
		return errors.New("subscription is nil")
	}

	var firebaseUID string
	if sub.Metadata != nil {
		firebaseUID = sub.Metadata["firebase_uid"]
	}

	if firebaseUID == "" && sub.Customer != nil {
		// Best-effort: try to read from customer metadata via expand.
		// This path is optional and may require additional API calls; for now we log only.
		log.Printf("[billing] subscription %s missing firebase_uid metadata", sub.ID)
	}

	planID := ""
	if len(sub.Items.Data) > 0 && sub.Items.Data[0].Price != nil {
		planID = sub.Items.Data[0].Price.ID
	}

	_, err := s.DB.ExecContext(ctx,
		`INSERT INTO stripe_subscriptions (
			subscription_id, firebase_uid, plan_id, status, current_period_start,
			current_period_end, cancel_at_period_end, created_at, updated_at
		) VALUES ($1, $2, $3, $4, to_timestamp($5), to_timestamp($6), $7, NOW(), NOW())
		ON CONFLICT (subscription_id) DO UPDATE SET
			firebase_uid = EXCLUDED.firebase_uid,
			plan_id = EXCLUDED.plan_id,
			status = EXCLUDED.status,
			current_period_start = EXCLUDED.current_period_start,
			current_period_end = EXCLUDED.current_period_end,
			cancel_at_period_end = EXCLUDED.cancel_at_period_end,
			updated_at = NOW()`,
		sub.ID,
		firebaseUID,
		planID,
		string(sub.Status),
		sub.CurrentPeriodStart,
		sub.CurrentPeriodEnd,
		sub.CancelAtPeriodEnd,
	)
	return err
}

// RecordEvent stores a raw Stripe event payload in stripe_events for audit.
func (s *Service) RecordEvent(ctx context.Context, evt *stripe.Event) error {
	if evt == nil {
		return errors.New("event is nil")
	}

	payload, err := json.Marshal(evt)
	if err != nil {
		return err
	}

	_, err = s.DB.ExecContext(ctx,
		"INSERT INTO stripe_events (event_id, type, payload, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT (event_id) DO NOTHING",
		evt.ID,
		evt.Type,
		payload,
		time.Now(),
	)
	return err
}
