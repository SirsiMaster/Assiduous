package firestore

import (
	"context"
	"log"
	"sync"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	clientOnce sync.Once
	client     *firestore.Client
	clientErr  error
)

// Client returns a singleton Firestore client using the given project ID.
// On Cloud Run this uses the service account via ADC; locally it uses gcloud creds.
func Client(ctx context.Context, projectID string) (*firestore.Client, error) {
	clientOnce.Do(func() {
		if projectID == "" {
			log.Println("[firestore] WARNING: empty projectID; set GCP_PROJECT_ID/GOOGLE_CLOUD_PROJECT")
		}
		client, clientErr = firestore.NewClient(ctx, projectID)
		if clientErr != nil {
			log.Printf("[firestore] failed to init client: %v", clientErr)
		}
	})
	return client, clientErr
}

// IsNotFound reports whether the given error is a Firestore NotFound error.
func IsNotFound(err error) bool {
	if err == nil {
		return false
	}
	return status.Code(err) == codes.NotFound
}

// MergeAll returns the firestore.MergeAll option so callers outside this
// package do not need to import the Firestore client library directly.
func MergeAll() firestore.SetOption {
	return firestore.MergeAll
}
