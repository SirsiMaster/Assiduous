package entitlements

import (
	"context"
	"log"
	"strings"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	fs "github.com/SirsiMaster/assiduous/backend/pkg/firestore"
)

// userSubscriptionSnapshot mirrors the subset of the Firestore user document
// written by updateUserSubscriptionEntitlement in backend/cmd/api/main.go.
type userSubscriptionSnapshot struct {
	Subscriptions struct {
		AssiduousRealty struct {
			Status           string    `firestore:"status"`
			PlanID           string    `firestore:"planId"`
			CurrentPeriodEnd time.Time `firestore:"currentPeriodEnd"`
		} `firestore:"assiduousRealty"`
	} `firestore:"subscriptions"`
}

// HasActiveAssiduousSubscription returns true when the given Firebase user has
// an active (or trialing) Assiduous Realty subscription recorded in Firestore.
//
// This is the server-side source of truth for premium feature entitlements.
func HasActiveAssiduousSubscription(ctx context.Context, projectID, firebaseUID string) (bool, error) {
	if projectID == "" || firebaseUID == "" {
		return false, nil
	}

	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return false, err
	}

	doc, err := client.Collection("users").Doc(firebaseUID).Get(ctx)
	if err != nil {
		// Treat missing document as no subscription.
		if st, ok := status.FromError(err); ok && st.Code() == codes.NotFound {
			return false, nil
		}
		return false, err
	}

	var snap userSubscriptionSnapshot
	if err := doc.DataTo(&snap); err != nil {
		log.Printf("[entitlements] DataTo error for user %s: %v", firebaseUID, err)
		return false, err
	}

	status := strings.ToLower(strings.TrimSpace(snap.Subscriptions.AssiduousRealty.Status))
	if status == "active" || status == "trialing" {
		return true, nil
	}

	// Treat any other status (including empty) as not entitled.
	return false, nil
}
