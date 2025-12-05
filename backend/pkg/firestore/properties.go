package firestore

import (
	"context"

	"cloud.google.com/go/firestore"
	"google.golang.org/api/iterator"
)

// Property represents the core fields used by the backend services.
// This should mirror the Firestore properties collection as documented
// in DATA_MODEL.md. Additional fields can be added as needed.
type Property struct {
	ID         string                 `firestore:"-" json:"id"`
	Address    string                 `firestore:"address" json:"address"`
	Price      float64                `firestore:"price" json:"price"`
	Bedrooms   int32                  `firestore:"bedrooms" json:"bedrooms"`
	Bathrooms  float64                `firestore:"bathrooms" json:"bathrooms"`
	SquareFeet int32                  `firestore:"squareFeet" json:"squareFeet"`
	Type       string                 `firestore:"type" json:"type"`
	Status     string                 `firestore:"status" json:"status"`
	AgentID    string                 `firestore:"agentId" json:"agentId"`
	Extra      map[string]interface{} `firestore:"-" json:"extra,omitempty"`
}

// PropertyRepository wraps Firestore access for properties.
type PropertyRepository struct {
	client *firestore.Client
}

// NewPropertyRepository constructs a repository using an existing client.
func NewPropertyRepository(client *firestore.Client) *PropertyRepository {
	return &PropertyRepository{client: client}
}

// GetByID fetches a single property by document id.
func (r *PropertyRepository) GetByID(ctx context.Context, id string) (*Property, error) {
	doc, err := r.client.Collection("properties").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var p Property
	if err := doc.DataTo(&p); err != nil {
		return nil, err
	}
	p.ID = doc.Ref.ID
	return &p, nil
}

// ListBasic returns a limited list of properties for simple listing UIs.
// Filtering/sorting will be expanded as we wire more endpoints.
func (r *PropertyRepository) ListBasic(ctx context.Context, limit int) ([]*Property, error) {
	if limit <= 0 {
		limit = 50
	}
	iter := r.client.Collection("properties").Limit(limit).Documents(ctx)
	defer iter.Stop()

	var out []*Property
	for {
		doc, err := iter.Next()
		if err != nil {
			if err == iterator.Done {
				break
			}
			return nil, err
		}
		var p Property
		if err := doc.DataTo(&p); err != nil {
			return nil, err
		}
		p.ID = doc.Ref.ID
		out = append(out, &p)
	}
	return out, nil
}
