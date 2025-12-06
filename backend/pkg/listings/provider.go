package listings

import (
	"context"
	"errors"
	"time"
)

// ProviderKey identifies a given listings provider implementation.
type ProviderKey string

const (
	ProviderMLS     ProviderKey = "mls"
	ProviderZillow  ProviderKey = "zillow"
	ProviderRedfin  ProviderKey = "redfin"
	ProviderRealtor ProviderKey = "realtor"
	ProviderFSBO    ProviderKey = "fsbo"
)

// RegionFilter describes a geographic region to search.
type RegionFilter struct {
	City       string `json:"city,omitempty"`
	State      string `json:"state,omitempty"`
	PostalCode string `json:"postalCode,omitempty"`
	// Optional bounding box in lat/lng for map-style searches.
	BBox *BBox `json:"bbox,omitempty"`
}

// BBox represents a simple lat/lng bounding box.
type BBox struct {
	North float64 `json:"north"`
	South float64 `json:"south"`
	East  float64 `json:"east"`
	West  float64 `json:"west"`
}

// FetchParams controls how many listings to fetch and from when.
type FetchParams struct {
	Since       time.Time    `json:"since,omitempty"`
	Region      RegionFilter `json:"region"`
	Limit       int          `json:"limit,omitempty"`
	PageToken   string       `json:"pageToken,omitempty"`
	MaxPages    int          `json:"maxPages,omitempty"`
	IncludeSold bool         `json:"includeSold,omitempty"`
}

// ExternalListing is a normalized representation of a listing returned by any
// third-party provider (MLS, portals, FSBO, etc.).
type ExternalListing struct {
	ExternalID string      `json:"externalId"`
	Source     ProviderKey `json:"source"`

	Address Address `json:"address"`

	ListPrice float64 `json:"listPrice"`
	Beds      float64 `json:"beds,omitempty"`
	Baths     float64 `json:"baths,omitempty"`
	Sqft      float64 `json:"sqft,omitempty"`
	Lat       float64 `json:"lat,omitempty"`
	Lng       float64 `json:"lng,omitempty"`

	Status       string    `json:"status,omitempty"`
	ListedAt     time.Time `json:"listedAt,omitempty"`
	UpdatedAt    time.Time `json:"updatedAt,omitempty"`
	RawJSON      []byte    `json:"rawJson,omitempty"`
	ProviderMeta any       `json:"providerMeta,omitempty"`
}

// Address is a simple mailing address plus coordinates.
type Address struct {
	Street1 string  `json:"street1,omitempty"`
	Street2 string  `json:"street2,omitempty"`
	City    string  `json:"city,omitempty"`
	State   string  `json:"state,omitempty"`
	Postal  string  `json:"postal,omitempty"`
	Country string  `json:"country,omitempty"`
	Lat     float64 `json:"lat,omitempty"`
	Lng     float64 `json:"lng,omitempty"`
}

// IngestResult captures what a provider returned for an ingest run.
type IngestResult struct {
	Provider ProviderKey       `json:"provider"`
	Listings []ExternalListing `json:"listings"`
	NextPage string            `json:"nextPage,omitempty"`
}

// Provider is implemented by each external listings connector.
type Provider interface {
	Key() ProviderKey
	DisplayName() string

	// Enabled reports whether this provider is configured and can be used.
	Enabled() bool

	// FetchListings fetches listings from the underlying service. Implementations
	// should be idempotent and safe to call from batch jobs.
	FetchListings(ctx context.Context, p FetchParams) (*IngestResult, error)
}

// ErrNotConfigured indicates that the provider exists in the registry but is
// not currently configured (e.g. missing API keys or base URL). API handlers
// can translate this into a 503-style response.
var ErrNotConfigured = errors.New("provider not configured")
