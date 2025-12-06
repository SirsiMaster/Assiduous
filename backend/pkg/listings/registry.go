package listings

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

// Registry holds the configured provider instances for use by API handlers or
// background jobs.
type Registry struct {
	providers map[ProviderKey]Provider
}

// NewRegistry constructs a Registry with stub provider implementations wired to
// environment-driven configuration. Each provider's Enabled method reflects
// whether the minimum config is present; FetchListings will currently return
// ErrNotConfigured until concrete HTTP integrations are added.
func NewRegistry() *Registry {
	r := &Registry{providers: make(map[ProviderKey]Provider)}

	// Generic MLS / RESO Web API provider
	r.providers[ProviderMLS] = &MLSProvider{
		key:          ProviderMLS,
		name:         "MLS / RESO",
		BaseURL:      os.Getenv("MLS_API_BASE_URL"),
		ClientID:     os.Getenv("MLS_API_CLIENT_ID"),
		ClientSecret: os.Getenv("MLS_API_CLIENT_SECRET"),
	}

	// Zillow provider (typically backed by a partner or scraper API)
	r.providers[ProviderZillow] = &ZillowProvider{
		key:      ProviderZillow,
		name:     "Zillow",
		BaseURL:  os.Getenv("ZILLOW_API_BASE_URL"),
		APIKey:   os.Getenv("ZILLOW_API_KEY"),
		RegionID: os.Getenv("ZILLOW_REGION_ID"),
	}

	// Redfin provider
	r.providers[ProviderRedfin] = &RedfinProvider{
		key:     ProviderRedfin,
		name:    "Redfin",
		BaseURL: os.Getenv("REDFIN_API_BASE_URL"),
		APIKey:  os.Getenv("REDFIN_API_KEY"),
	}

	// Realtor.com provider
	r.providers[ProviderRealtor] = &RealtorProvider{
		key:     ProviderRealtor,
		name:    "Realtor.com",
		BaseURL: os.Getenv("REALTOR_API_BASE_URL"),
		APIKey:  os.Getenv("REALTOR_API_KEY"),
	}

	// Generic FSBO provider (e.g. FSBO portals, classifieds, etc.)
	r.providers[ProviderFSBO] = &FSBOProvider{
		key:     ProviderFSBO,
		name:    "For Sale By Owner",
		BaseURL: os.Getenv("FSBO_API_BASE_URL"),
		APIKey:  os.Getenv("FSBO_API_KEY"),
	}

	return r
}

// Get returns a provider by key if configured in the registry.
func (r *Registry) Get(key ProviderKey) (Provider, bool) {
	p, ok := r.providers[key]
	return p, ok
}

// EnabledProviders returns all providers that report Enabled()==true.
func (r *Registry) EnabledProviders() []Provider {
	out := make([]Provider, 0, len(r.providers))
	for _, p := range r.providers {
		if p.Enabled() {
			out = append(out, p)
		}
	}
	return out
}

// Providers returns all providers currently registered. The slice is not
// sorted and should be treated as read-only by callers.
func (r *Registry) Providers() []Provider {
	out := make([]Provider, 0, len(r.providers))
	for _, p := range r.providers {
		out = append(out, p)
	}
	return out
}

// --- Provider implementations ---

// MLSProvider is a generic MLS/RESO connector that expects an upstream
// service to expose a simple JSON API under the configured BaseURL. The
// upstream service is responsible for authenticating to the real MLS and
// mapping its payloads into our normalized ExternalListing shape.
type MLSProvider struct {
	key          ProviderKey
	name         string
	BaseURL      string
	ClientID     string
	ClientSecret string
}

func (p *MLSProvider) Key() ProviderKey    { return p.key }
func (p *MLSProvider) DisplayName() string { return p.name }
func (p *MLSProvider) Enabled() bool       { return p.BaseURL != "" && p.ClientID != "" }
func (p *MLSProvider) FetchListings(ctx context.Context, fp FetchParams) (*IngestResult, error) {
	if p.BaseURL == "" || p.ClientID == "" {
		return nil, ErrNotConfigured
	}

	base, err := url.Parse(p.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid MLS base URL: %w", err)
	}
	base.Path = "/listings"

	q := base.Query()
	if fp.Region.City != "" {
		q.Set("city", fp.Region.City)
	}
	if fp.Region.State != "" {
		q.Set("state", fp.Region.State)
	}
	if fp.Region.PostalCode != "" {
		q.Set("postalCode", fp.Region.PostalCode)
	}
	if !fp.Since.IsZero() {
		q.Set("since", fp.Since.Format(time.RFC3339))
	}
	if fp.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", fp.Limit))
	}
	if fp.PageToken != "" {
		q.Set("pageToken", fp.PageToken)
	}
	if fp.IncludeSold {
		q.Set("includeSold", "true")
	}
	base.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-MLS-Client-ID", p.ClientID)
	if p.ClientSecret != "" {
		req.Header.Set("X-MLS-Client-Secret", p.ClientSecret)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("MLS HTTP request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("MLS provider returned status %d", resp.StatusCode)
	}

	var payload struct {
		Listings      []struct {
			ExternalID string  `json:"externalId"`
			Address    Address `json:"address"`
			ListPrice  float64 `json:"listPrice"`
			Beds       float64 `json:"beds"`
			Baths      float64 `json:"baths"`
			Sqft       float64 `json:"sqft"`
			Lat        float64 `json:"lat"`
			Lng        float64 `json:"lng"`
			Status     string  `json:"status"`
			ListedAt   string  `json:"listedAt"`
			UpdatedAt  string  `json:"updatedAt"`
		} `json:"listings"`
		NextPageToken string `json:"nextPageToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode MLS payload: %w", err)
	}

	out := &IngestResult{Provider: ProviderMLS}
	for _, l := range payload.Listings {
		el := ExternalListing{
			ExternalID: l.ExternalID,
			Source:     ProviderMLS,
			Address:    l.Address,
			ListPrice:  l.ListPrice,
			Beds:       l.Beds,
			Baths:      l.Baths,
			Sqft:       l.Sqft,
			Lat:        l.Lat,
			Lng:        l.Lng,
			Status:     l.Status,
		}
		if l.ListedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.ListedAt); err == nil {
				el.ListedAt = t
			}
		}
		if l.UpdatedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.UpdatedAt); err == nil {
				el.UpdatedAt = t
			}
		}
		out.Listings = append(out.Listings, el)
	}
	out.NextPage = payload.NextPageToken
	return out, nil
}

// ZillowProvider talks to a Zillow-style or portal aggregator API. The upstream
// service is responsible for honoring Zillow/portal terms and presenting a
// normalized JSON payload; this connector focuses on mapping that payload into
// ExternalListing.
type ZillowProvider struct {
	key      ProviderKey
	name     string
	BaseURL  string
	APIKey   string
	RegionID string
}

func (p *ZillowProvider) Key() ProviderKey    { return p.key }
func (p *ZillowProvider) DisplayName() string { return p.name }
func (p *ZillowProvider) Enabled() bool       { return p.BaseURL != "" && p.APIKey != "" }
func (p *ZillowProvider) FetchListings(ctx context.Context, fp FetchParams) (*IngestResult, error) {
	if !p.Enabled() {
		return nil, ErrNotConfigured
	}

	base, err := url.Parse(p.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Zillow base URL: %w", err)
	}
	base.Path = "/listings"

	q := base.Query()
	if fp.Region.City != "" {
		q.Set("city", fp.Region.City)
	}
	if fp.Region.State != "" {
		q.Set("state", fp.Region.State)
	}
	if fp.Region.PostalCode != "" {
		q.Set("postalCode", fp.Region.PostalCode)
	}
	if !fp.Since.IsZero() {
		q.Set("since", fp.Since.Format(time.RFC3339))
	}
	if fp.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", fp.Limit))
	}
	if fp.PageToken != "" {
		q.Set("pageToken", fp.PageToken)
	}
	if fp.IncludeSold {
		q.Set("includeSold", "true")
	}
	if p.RegionID != "" {
		q.Set("regionId", p.RegionID)
	}
	base.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-Key", p.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Zillow HTTP request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Zillow provider returned status %d", resp.StatusCode)
	}

	var payload struct {
		Listings      []struct {
			ExternalID string  `json:"externalId"`
			Address    Address `json:"address"`
			ListPrice  float64 `json:"listPrice"`
			Beds       float64 `json:"beds"`
			Baths      float64 `json:"baths"`
			Sqft       float64 `json:"sqft"`
			Lat        float64 `json:"lat"`
			Lng        float64 `json:"lng"`
			Status     string  `json:"status"`
			ListedAt   string  `json:"listedAt"`
			UpdatedAt  string  `json:"updatedAt"`
		} `json:"listings"`
		NextPageToken string `json:"nextPageToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode Zillow payload: %w", err)
	}

	out := &IngestResult{Provider: ProviderZillow}
	for _, l := range payload.Listings {
		el := ExternalListing{
			ExternalID: l.ExternalID,
			Source:     ProviderZillow,
			Address:    l.Address,
			ListPrice:  l.ListPrice,
			Beds:       l.Beds,
			Baths:      l.Baths,
			Sqft:       l.Sqft,
			Lat:        l.Lat,
			Lng:        l.Lng,
			Status:     l.Status,
		}
		if l.ListedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.ListedAt); err == nil {
				el.ListedAt = t
			}
		}
		if l.UpdatedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.UpdatedAt); err == nil {
				el.UpdatedAt = t
			}
		}
		out.Listings = append(out.Listings, el)
	}
	out.NextPage = payload.NextPageToken
	return out, nil
}

// RedfinProvider talks to a Redfin-style or portal aggregator.
type RedfinProvider struct {
	key     ProviderKey
	name    string
	BaseURL string
	APIKey  string
}

func (p *RedfinProvider) Key() ProviderKey    { return p.key }
func (p *RedfinProvider) DisplayName() string { return p.name }
func (p *RedfinProvider) Enabled() bool       { return p.BaseURL != "" && p.APIKey != "" }
func (p *RedfinProvider) FetchListings(ctx context.Context, fp FetchParams) (*IngestResult, error) {
	if !p.Enabled() {
		return nil, ErrNotConfigured
	}

	base, err := url.Parse(p.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Redfin base URL: %w", err)
	}
	base.Path = "/listings"

	q := base.Query()
	if fp.Region.City != "" {
		q.Set("city", fp.Region.City)
	}
	if fp.Region.State != "" {
		q.Set("state", fp.Region.State)
	}
	if fp.Region.PostalCode != "" {
		q.Set("postalCode", fp.Region.PostalCode)
	}
	if !fp.Since.IsZero() {
		q.Set("since", fp.Since.Format(time.RFC3339))
	}
	if fp.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", fp.Limit))
	}
	if fp.PageToken != "" {
		q.Set("pageToken", fp.PageToken)
	}
	if fp.IncludeSold {
		q.Set("includeSold", "true")
	}
	base.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-Key", p.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Redfin HTTP request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Redfin provider returned status %d", resp.StatusCode)
	}

	var payload struct {
		Listings      []struct {
			ExternalID string  `json:"externalId"`
			Address    Address `json:"address"`
			ListPrice  float64 `json:"listPrice"`
			Beds       float64 `json:"beds"`
			Baths      float64 `json:"baths"`
			Sqft       float64 `json:"sqft"`
			Lat        float64 `json:"lat"`
			Lng        float64 `json:"lng"`
			Status     string  `json:"status"`
			ListedAt   string  `json:"listedAt"`
			UpdatedAt  string  `json:"updatedAt"`
		} `json:"listings"`
		NextPageToken string `json:"nextPageToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode Redfin payload: %w", err)
	}

	out := &IngestResult{Provider: ProviderRedfin}
	for _, l := range payload.Listings {
		el := ExternalListing{
			ExternalID: l.ExternalID,
			Source:     ProviderRedfin,
			Address:    l.Address,
			ListPrice:  l.ListPrice,
			Beds:       l.Beds,
			Baths:      l.Baths,
			Sqft:       l.Sqft,
			Lat:        l.Lat,
			Lng:        l.Lng,
			Status:     l.Status,
		}
		if l.ListedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.ListedAt); err == nil {
				el.ListedAt = t
			}
		}
		if l.UpdatedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.UpdatedAt); err == nil {
				el.UpdatedAt = t
			}
		}
		out.Listings = append(out.Listings, el)
	}
	out.NextPage = payload.NextPageToken
	return out, nil
}

// RealtorProvider talks to a Realtor.com-style portal aggregator.
type RealtorProvider struct {
	key     ProviderKey
	name    string
	BaseURL string
	APIKey  string
}

func (p *RealtorProvider) Key() ProviderKey    { return p.key }
func (p *RealtorProvider) DisplayName() string { return p.name }
func (p *RealtorProvider) Enabled() bool       { return p.BaseURL != "" && p.APIKey != "" }
func (p *RealtorProvider) FetchListings(ctx context.Context, fp FetchParams) (*IngestResult, error) {
	if !p.Enabled() {
		return nil, ErrNotConfigured
	}

	base, err := url.Parse(p.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid Realtor base URL: %w", err)
	}
	base.Path = "/listings"

	q := base.Query()
	if fp.Region.City != "" {
		q.Set("city", fp.Region.City)
	}
	if fp.Region.State != "" {
		q.Set("state", fp.Region.State)
	}
	if fp.Region.PostalCode != "" {
		q.Set("postalCode", fp.Region.PostalCode)
	}
	if !fp.Since.IsZero() {
		q.Set("since", fp.Since.Format(time.RFC3339))
	}
	if fp.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", fp.Limit))
	}
	if fp.PageToken != "" {
		q.Set("pageToken", fp.PageToken)
	}
	if fp.IncludeSold {
		q.Set("includeSold", "true")
	}
	base.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-Key", p.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Realtor HTTP request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Realtor provider returned status %d", resp.StatusCode)
	}

	var payload struct {
		Listings      []struct {
			ExternalID string  `json:"externalId"`
			Address    Address `json:"address"`
			ListPrice  float64 `json:"listPrice"`
			Beds       float64 `json:"beds"`
			Baths      float64 `json:"baths"`
			Sqft       float64 `json:"sqft"`
			Lat        float64 `json:"lat"`
			Lng        float64 `json:"lng"`
			Status     string  `json:"status"`
			ListedAt   string  `json:"listedAt"`
			UpdatedAt  string  `json:"updatedAt"`
		} `json:"listings"`
		NextPageToken string `json:"nextPageToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode Realtor payload: %w", err)
	}

	out := &IngestResult{Provider: ProviderRealtor}
	for _, l := range payload.Listings {
		el := ExternalListing{
			ExternalID: l.ExternalID,
			Source:     ProviderRealtor,
			Address:    l.Address,
			ListPrice:  l.ListPrice,
			Beds:       l.Beds,
			Baths:      l.Baths,
			Sqft:       l.Sqft,
			Lat:        l.Lat,
			Lng:        l.Lng,
			Status:     l.Status,
		}
		if l.ListedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.ListedAt); err == nil {
				el.ListedAt = t
			}
		}
		if l.UpdatedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.UpdatedAt); err == nil {
				el.UpdatedAt = t
			}
		}
		out.Listings = append(out.Listings, el)
	}
	out.NextPage = payload.NextPageToken
	return out, nil
}

// FSBOProvider talks to an FSBO/owner-direct aggregator (classifieds, FSBO
// portals, etc.).
type FSBOProvider struct {
	key     ProviderKey
	name    string
	BaseURL string
	APIKey  string
}

func (p *FSBOProvider) Key() ProviderKey    { return p.key }
func (p *FSBOProvider) DisplayName() string { return p.name }
func (p *FSBOProvider) Enabled() bool       { return p.BaseURL != "" && p.APIKey != "" }
func (p *FSBOProvider) FetchListings(ctx context.Context, fp FetchParams) (*IngestResult, error) {
	if !p.Enabled() {
		return nil, ErrNotConfigured
	}

	base, err := url.Parse(p.BaseURL)
	if err != nil {
		return nil, fmt.Errorf("invalid FSBO base URL: %w", err)
	}
	base.Path = "/listings"

	q := base.Query()
	if fp.Region.City != "" {
		q.Set("city", fp.Region.City)
	}
	if fp.Region.State != "" {
		q.Set("state", fp.Region.State)
	}
	if fp.Region.PostalCode != "" {
		q.Set("postalCode", fp.Region.PostalCode)
	}
	if !fp.Since.IsZero() {
		q.Set("since", fp.Since.Format(time.RFC3339))
	}
	if fp.Limit > 0 {
		q.Set("limit", fmt.Sprintf("%d", fp.Limit))
	}
	if fp.PageToken != "" {
		q.Set("pageToken", fp.PageToken)
	}
	if fp.IncludeSold {
		q.Set("includeSold", "true")
	}
	base.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, base.String(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-API-Key", p.APIKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("FSBO HTTP request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("FSBO provider returned status %d", resp.StatusCode)
	}

	var payload struct {
		Listings      []struct {
			ExternalID string  `json:"externalId"`
			Address    Address `json:"address"`
			ListPrice  float64 `json:"listPrice"`
			Beds       float64 `json:"beds"`
			Baths      float64 `json:"baths"`
			Sqft       float64 `json:"sqft"`
			Lat        float64 `json:"lat"`
			Lng        float64 `json:"lng"`
			Status     string  `json:"status"`
			ListedAt   string  `json:"listedAt"`
			UpdatedAt  string  `json:"updatedAt"`
		} `json:"listings"`
		NextPageToken string `json:"nextPageToken"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("failed to decode FSBO payload: %w", err)
	}

	out := &IngestResult{Provider: ProviderFSBO}
	for _, l := range payload.Listings {
		el := ExternalListing{
			ExternalID: l.ExternalID,
			Source:     ProviderFSBO,
			Address:    l.Address,
			ListPrice:  l.ListPrice,
			Beds:       l.Beds,
			Baths:      l.Baths,
			Sqft:       l.Sqft,
			Lat:        l.Lat,
			Lng:        l.Lng,
			Status:     l.Status,
		}
		if l.ListedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.ListedAt); err == nil {
				el.ListedAt = t
			}
		}
		if l.UpdatedAt != "" {
			if t, err := time.Parse(time.RFC3339, l.UpdatedAt); err == nil {
				el.UpdatedAt = t
			}
		}
		out.Listings = append(out.Listings, el)
	}
	out.NextPage = payload.NextPageToken
	return out, nil
}
