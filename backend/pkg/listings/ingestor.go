package listings

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	fs "github.com/SirsiMaster/assiduous/backend/pkg/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// UpsertSummary captures what happened when persisting listings into
// Firestore. This is intentionally simple for now; as ingest volume grows we
// can move to batched writes and richer metrics.
type UpsertSummary struct {
	Provider  ProviderKey `json:"provider"`
	Attempted int         `json:"attempted"`
	Created   int         `json:"created"`
	Updated   int         `json:"updated"`
	Skipped   int         `json:"skipped"`
}

// UpsertExternalListingsToFirestore writes provider listings into the
// Firestore properties collection using a deterministic document id derived
// from provider + external id. The mapping is intentionally conservative and
// uses Merge semantics so we do not clobber any existing fields populated by
// legacy flows.
func UpsertExternalListingsToFirestore(ctx context.Context, projectID string, res *IngestResult) (*UpsertSummary, error) {
	if res == nil {
		return &UpsertSummary{}, nil
	}
	if projectID == "" {
		return nil, fmt.Errorf("projectID is required for Firestore ingest")
	}

	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	summary := &UpsertSummary{Provider: res.Provider}
	for _, l := range res.Listings {
		summary.Attempted++

		if strings.TrimSpace(l.ExternalID) == "" {
			log.Printf("[listings] skipping listing with empty external id (provider=%s)", res.Provider)
			summary.Skipped++
			continue
		}

		id := buildPropertyID(res.Provider, l.ExternalID)
		ref := client.Collection("properties").Doc(id)

		// Construct a conservative update payload. We intentionally avoid
		// removing any fields; we only merge the ones we know about.
		addr := map[string]any{}
		if l.Address.Street1 != "" {
			addr["street"] = l.Address.Street1
		}
		if l.Address.City != "" {
			addr["city"] = l.Address.City
		}
		if l.Address.State != "" {
			addr["state"] = l.Address.State
		}
		if l.Address.Postal != "" {
			addr["postalCode"] = l.Address.Postal
		}
		// If we have coordinates, expose them as a simple object with latitude
		// and longitude fields so legacy client code can consume them without
		// depending on Firestore SDK types.
		if l.Lat != 0 && l.Lng != 0 {
			addr["coordinates"] = map[string]any{
				"latitude":  l.Lat,
				"longitude": l.Lng,
			}
		}

		data := map[string]any{
			"source":     string(l.Source),
			"externalId": l.ExternalID,
		}
		if len(addr) > 0 {
			data["address"] = addr
		}
		if l.ListPrice > 0 {
			data["price"] = l.ListPrice
		}
		if l.Beds > 0 {
			data["bedrooms"] = int32(l.Beds)
		}
		if l.Baths > 0 {
			data["bathrooms"] = l.Baths
		}
		if l.Sqft > 0 {
			data["squareFeet"] = int32(l.Sqft)
		}
		if l.Status != "" {
			data["status"] = l.Status
		}
		// Track provider-specific ids so legacy client services can still look
		// up related documents (e.g. mls_data) by id when we add them.
		if l.Source == ProviderMLS {
			data["mlsId"] = l.ExternalID
		}

		// Timestamp bookkeeping – we only set createdAt when the document did
		// not previously exist. updatedAt is always bumped.
		now := time.Now()
		data["updatedAt"] = now

		// Check existence so we can keep basic created/updated counters.
		_, err := ref.Get(ctx)
		if err != nil {
			if status.Code(err) == codes.NotFound {
				data["createdAt"] = now
				if _, err := ref.Set(ctx, data, fs.MergeAll()); err != nil {
					log.Printf("[listings] failed to create property doc id=%s: %v", id, err)
					summary.Skipped++
					continue
				}
				summary.Created++
				continue
			}

			log.Printf("[listings] failed to read property doc id=%s: %v", id, err)
			summary.Skipped++
			continue
		}

		// Document exists – merge the update payload.
		if _, err := ref.Set(ctx, data, fs.MergeAll()); err != nil {
			summary.Skipped++
			continue
		}
		summary.Updated++
	}

	return summary, nil
}

func buildPropertyID(provider ProviderKey, externalID string) string {
	clean := strings.ReplaceAll(strings.TrimSpace(externalID), " ", "-")
	return fmt.Sprintf("%s_%s", provider, clean)
}
