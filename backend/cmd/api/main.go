package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	gfs "cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/SirsiMaster/assiduous/backend/pkg/auth"
	"github.com/SirsiMaster/assiduous/backend/pkg/billing"
	"github.com/SirsiMaster/assiduous/backend/pkg/config"
	"github.com/SirsiMaster/assiduous/backend/pkg/firestore"
	"github.com/SirsiMaster/assiduous/backend/pkg/httpapi"
	"github.com/SirsiMaster/assiduous/backend/pkg/kms"
	"github.com/SirsiMaster/assiduous/backend/pkg/lob"
	"github.com/SirsiMaster/assiduous/backend/pkg/opensign"
	"github.com/SirsiMaster/assiduous/backend/pkg/plaid"
	"github.com/SirsiMaster/assiduous/backend/pkg/sqlclient"
	"github.com/SirsiMaster/assiduous/backend/pkg/ai"
	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/webhook"
)

func main() {
	cfg := config.Load()

	ctx := context.Background()

	// Initialize shared SQL client for integrations like Stripe and Plaid.
	sqlDB, err := sqlclient.New()
	if err != nil {
		log.Printf("[api] warning: failed to initialize SQL client: %v", err)
	}

	billSvc, err := billing.NewService(sqlDB)
	if err != nil {
		log.Printf("[api] warning: Stripe billing not fully configured: %v", err)
	}

	plaidSvc, err := plaid.NewService(sqlDB)
	if err != nil {
		log.Printf("[api] warning: Plaid not fully configured: %v", err)
	}

	lobSvc, err := lob.NewService(sqlDB)
	if err != nil {
		log.Printf("[api] warning: Lob not fully configured: %v", err)
	}

	openSignSvc, err := opensign.NewService(sqlDB)
	if err != nil {
		log.Printf("[api] warning: OpenSign not fully configured: %v", err)
	}

	aiSvc, err := ai.NewService(ctx, cfg.ProjectID, cfg.Region)
	if err != nil {
		log.Printf("[api] warning: Vertex AI not fully configured: %v", err)
	}

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(auth.Middleware)

	// Simple health endpoint for Cloud Run and monitoring.
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpapi.JSON(w, http.StatusOK, map[string]any{
			"status":   "ok",
			"env":      cfg.Env,
			"projectId": cfg.ProjectID,
		})
	})

	// Crypto endpoints
	r.Route("/api/crypto", func(r chi.Router) {
		r.Post("/dek", func(w http.ResponseWriter, r *http.Request) {
			// Require authenticated user for DEK issuance.
			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			// Generate a random 256-bit DEK.
			dek := make([]byte, 32)
			if _, err := rand.Read(dek); err != nil {
				log.Printf("[crypto] failed to generate DEK: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "internal_error", "failed to generate key")
				return
			}

			// Wrap the DEK using Cloud KMS.
			wrapped, err := kms.WrapDEK(r.Context(), "", dek)
			if err != nil {
				log.Printf("[crypto] failed to wrap DEK: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "kms_error", "failed to wrap key")
				return
			}

			// Return both plaintext (for immediate client-side use) and wrapped key (for storage).
			httpapi.JSON(w, http.StatusOK, map[string]any{
				"plaintext": base64.StdEncoding.EncodeToString(dek),
				"wrapped":   base64.StdEncoding.EncodeToString(wrapped),
				// keyName is resolved from environment inside the kms package when empty.
				"keyName":   os.Getenv("KMS_KEY_NAME"),
				"keyVersion": "", // Optional: can be populated when using versioned keys
			})
		})
	})

	// AI endpoints (Vertex/Gemini)
	r.Route("/api/ai", func(r chi.Router) {
		// POST /api/ai/explain
		// Body: { "prompt": "..." }
		// Returns a simple text explanation from the configured Gemini model.
		r.Post("/explain", func(w http.ResponseWriter, r *http.Request) {
			if aiSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "ai_unavailable", "AI service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			var req struct {
				Prompt string `json:"prompt"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}
			if strings.TrimSpace(req.Prompt) == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "prompt is required")
				return
			}

			answer, err := aiSvc.Explain(r.Context(), req.Prompt)
			if err != nil {
				log.Printf("[ai] Explain error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "ai_error", "failed to generate explanation")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"answer": answer})
		})
	})

	// OpenSign endpoints (e-sign envelopes)
	r.Route("/api/opensign", func(r chi.Router) {
		// POST /api/opensign/envelopes
		// Body: { "docType": "...", "recipients": [...], "metadata": {...} }
		// Only admin/agent roles are permitted to create envelopes.
		r.Post("/envelopes", func(w http.ResponseWriter, r *http.Request) {
			if openSignSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "opensign_unavailable", "OpenSign service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			if uc.Role != "admin" && uc.Role != "agent" {
				httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient role to create signing envelopes")
				return
			}

			var req struct {
				DocType    string            `json:"docType"`
				Recipients []map[string]any `json:"recipients"`
				Metadata   map[string]any   `json:"metadata,omitempty"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}
			if req.DocType == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "docType is required")
				return
			}

			env, err := openSignSvc.CreateEnvelope(r.Context(), opensign.CreateEnvelopeRequest{
				FirebaseUID: uc.UID,
				DocType:     req.DocType,
				Recipients:  req.Recipients,
				Metadata:    req.Metadata,
			})
			if err != nil {
				log.Printf("[opensign] CreateEnvelope error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "opensign_error", "failed to create envelope")
				return
			}

			resp := map[string]any{
				"envelopeId": env.EnvelopeID,
				"status":     env.Status,
			}
			if env.SigningURL != nil {
				resp["signingUrl"] = *env.SigningURL
			}

			httpapi.JSON(w, http.StatusOK, resp)
		})

		// GET /api/opensign/envelopes
		// Returns recent envelopes for the current user.
		r.Get("/envelopes", func(w http.ResponseWriter, r *http.Request) {
			if openSignSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "opensign_unavailable", "OpenSign service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			if uc.Role != "admin" && uc.Role != "agent" {
				httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient role to list envelopes")
				return
			}

			// For now, return the last 10 envelopes; can be expanded with query params later.
			envelopes, err := openSignSvc.ListEnvelopes(r.Context(), uc.UID, 10)
			if err != nil {
				log.Printf("[opensign] ListEnvelopes error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "opensign_error", "failed to load envelopes")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"envelopes": envelopes})
		})

		// POST /api/opensign/webhook
		// OpenSign will call this endpoint with envelope status updates.
		r.Post("/webhook", func(w http.ResponseWriter, r *http.Request) {
			secret := os.Getenv("OPENSIGN_WEBHOOK_SECRET")
			if secret != "" {
				if r.Header.Get("X-OpenSign-Secret") != secret {
					log.Printf("[opensign] invalid webhook secret")
					w.WriteHeader(http.StatusUnauthorized)
					return
				}
			}

			var payload struct {
				EnvelopeID string            `json:"envelopeId"`
				Status     string            `json:"status"`
				Metadata   map[string]any   `json:"metadata,omitempty"`
			}
			if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
				log.Printf("[opensign] webhook decode error: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			if payload.EnvelopeID == "" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			if openSignSvc == nil {
				// If OpenSign isn't configured, just acknowledge to avoid retry storms.
				w.WriteHeader(http.StatusOK)
				return
			}

			if err := openSignSvc.UpdateEnvelopeStatus(r.Context(), payload.EnvelopeID, payload.Status, payload.Metadata); err != nil {
				log.Printf("[opensign] UpdateEnvelopeStatus error: %v", err)
			}

			w.WriteHeader(http.StatusOK)
		})
	})

	// Lob endpoints (certified mail)
	r.Route("/api/lob", func(r chi.Router) {
		// POST /api/lob/letters
		// Body: { "toAddress": {...}, "templateId": "..." }
		r.Post("/letters", func(w http.ResponseWriter, r *http.Request) {
			if lobSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "lob_unavailable", "Lob service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			// Only admins and agents are allowed to send certified mail via Lob.
			if uc.Role != "admin" && uc.Role != "agent" {
				httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient role to send certified mail")
				return
			}

			var req struct {
				ToAddress  map[string]any `json:"toAddress"`
				TemplateID string        `json:"templateId"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}
			if req.TemplateID == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "templateId is required")
				return
			}

			letterID, err := lobSvc.CreateLetter(r.Context(), lob.CreateLetterRequest{
				FirebaseUID: uc.UID,
				ToAddress:   req.ToAddress,
				TemplateID:  req.TemplateID,
			})
			if err != nil {
				log.Printf("[lob] CreateLetter error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "lob_error", "failed to create letter")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"letterId": letterID})
		})
	})

	// Plaid endpoints (banking integration)
	r.Route("/api/plaid", func(r chi.Router) {
		// POST /api/plaid/link-token
		// Body: { "userName": "Jane Doe" }
		r.Post("/link-token", func(w http.ResponseWriter, r *http.Request) {
			if plaidSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "plaid_unavailable", "Plaid service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			var req struct {
				UserName string `json:"userName"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}

			linkToken, err := plaidSvc.CreateLinkToken(r.Context(), uc.UID, req.UserName)
			if err != nil {
				log.Printf("[plaid] CreateLinkToken error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "plaid_error", "failed to create link token")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"linkToken": linkToken})
		})

		// POST /api/plaid/token-exchange
		// Body: { "publicToken": "...", "institutionName": "..." }
		r.Post("/token-exchange", func(w http.ResponseWriter, r *http.Request) {
			if plaidSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "plaid_unavailable", "Plaid service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			var req struct {
				PublicToken     string `json:"publicToken"`
				InstitutionName string `json:"institutionName"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}
			if req.PublicToken == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "publicToken is required")
				return
			}

			if err := plaidSvc.ExchangePublicToken(r.Context(), uc.UID, req.PublicToken, req.InstitutionName); err != nil {
				log.Printf("[plaid] ExchangePublicToken error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "plaid_error", "failed to exchange token")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"status": "ok"})
		})

		// GET /api/plaid/accounts
		// Returns a flattened view of Plaid accounts for the current user.
		r.Get("/accounts", func(w http.ResponseWriter, r *http.Request) {
			if plaidSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "plaid_unavailable", "Plaid service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			accounts, err := plaidSvc.GetAccounts(r.Context(), uc.UID)
			if err != nil {
				log.Printf("[plaid] GetAccounts error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "plaid_error", "failed to fetch accounts")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"accounts": accounts})
		})
	})

	// Billing endpoints (Stripe subscriptions)
	r.Route("/api/billing", func(r chi.Router) {
		// POST /api/billing/checkout-session
		// Body: { "planPriceId": "price_...", "successUrl": "...", "cancelUrl": "..." }
		r.Post("/checkout-session", func(w http.ResponseWriter, r *http.Request) {
			if billSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "billing_unavailable", "billing service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			var req struct {
				PlanPriceID string `json:"planPriceId"`
				SuccessURL  string `json:"successUrl"`
				CancelURL   string `json:"cancelUrl"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}
			if req.PlanPriceID == "" || req.SuccessURL == "" || req.CancelURL == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "planPriceId, successUrl and cancelUrl are required")
				return
			}

			customerID, err := billSvc.EnsureCustomer(r.Context(), uc.UID, uc.Email)
			if err != nil {
				log.Printf("[billing] EnsureCustomer error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "billing_error", "failed to ensure customer")
				return
			}

			url, err := billSvc.CreateCheckoutSession(r.Context(), uc.UID, customerID, req.PlanPriceID, req.SuccessURL, req.CancelURL)
			if err != nil {
				log.Printf("[billing] CreateCheckoutSession error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "billing_error", "failed to create checkout session")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"url": url})
		})

		// POST /api/billing/webhook
		// Stripe will call this endpoint for subscription lifecycle events.
		r.Post("/webhook", func(w http.ResponseWriter, r *http.Request) {
			if billSvc == nil {
				// If billing isn't configured, treat as no-op to avoid Stripe retries storm.
				w.WriteHeader(http.StatusOK)
				return
			}

			whSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
			if whSecret == "" {
				log.Printf("[billing] STRIPE_WEBHOOK_SECRET not configured")
				w.WriteHeader(http.StatusOK)
				return
			}

			payload, err := io.ReadAll(r.Body)
			if err != nil {
				log.Printf("[billing] webhook read error: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			sig := r.Header.Get("Stripe-Signature")
			event, err := webhook.ConstructEvent(payload, sig, whSecret)
			if err != nil {
				log.Printf("[billing] webhook signature verification failed: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			// Record raw event for audit (best-effort)
			if err := billSvc.RecordEvent(r.Context(), &event); err != nil {
				log.Printf("[billing] RecordEvent error: %v", err)
			}

			switch event.Type {
			case "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted":
				var sub stripe.Subscription
				if err := json.Unmarshal(event.Data.Raw, &sub); err != nil {
					log.Printf("[billing] failed to unmarshal subscription from event %s: %v", event.ID, err)
					break
				}

				if err := billSvc.UpsertSubscriptionFromEvent(r.Context(), &sub); err != nil {
					log.Printf("[billing] UpsertSubscriptionFromEvent error: %v", err)
				}

				if err := updateUserSubscriptionEntitlement(r.Context(), cfg.ProjectID, &sub); err != nil {
					log.Printf("[billing] updateUserSubscriptionEntitlement error: %v", err)
				}
			default:
				// Other events currently ignored; still recorded above.
			}

			w.WriteHeader(http.StatusOK)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	log.Printf("[api] starting on %s (env=%s, project=%s)", addr, cfg.Env, cfg.ProjectID)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("[api] server error: %v", err)
	}
}

// updateUserSubscriptionEntitlement writes a simplified subscription entitlement
// snapshot into the Firestore users collection under subscriptions.assiduousRealty.
func updateUserSubscriptionEntitlement(ctx context.Context, projectID string, sub *stripe.Subscription) error {
	if sub == nil || projectID == "" {
		return nil
	}

	firebaseUID := ""
	if sub.Metadata != nil {
		firebaseUID = sub.Metadata["firebase_uid"]
	}
	if firebaseUID == "" {
		// Best-effort only; nothing to do if we cannot associate to a user.
		return nil
	}

	planID := ""
	if len(sub.Items.Data) > 0 && sub.Items.Data[0].Price != nil {
		planID = sub.Items.Data[0].Price.ID
	}

	client, err := firestore.Client(ctx, projectID)
	if err != nil {
		return err
	}

	data := map[string]any{
		"subscriptions": map[string]any{
			"assiduousRealty": map[string]any{
				"planId":           planID,
				"status":          string(sub.Status),
				"currentPeriodEnd": time.Unix(sub.CurrentPeriodEnd, 0),
			},
		},
	}

	_, err = client.Collection("users").Doc(firebaseUID).Set(ctx, data, gfs.MergeAll)
	return err
}
