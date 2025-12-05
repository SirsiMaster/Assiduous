package opensign

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"time"
)

// Service wraps OpenSign HTTP client and SQL access for envelope tracking.
type Service struct {
	BaseURL    string
	APIKey     string
	HTTPClient *http.Client
	DB         *sql.DB
}

// NewService constructs an OpenSign service using OPENSIGN_* environment variables.
// If required configuration is missing, it returns an error so callers can log a warning
// and treat the integration as unavailable.
func NewService(db *sql.DB) (*Service, error) {
	baseURL := os.Getenv("OPENSIGN_BASE_URL")
	apiKey := os.Getenv("OPENSIGN_API_KEY")

	if baseURL == "" || apiKey == "" {
		return nil, errors.New("OPENSIGN_BASE_URL or OPENSIGN_API_KEY not configured")
	}

	return &Service{
		BaseURL: baseURL,
		APIKey:  apiKey,
		HTTPClient: &http.Client{
			Timeout: 15 * time.Second,
		},
		DB: db,
	}, nil
}

// CreateEnvelopeRequest captures inputs required to initiate a signing session.
type CreateEnvelopeRequest struct {
	FirebaseUID string                   `json:"firebaseUid"`
	DocType     string                   `json:"docType"`
	Recipients  []map[string]any         `json:"recipients"`
	Metadata    map[string]any           `json:"metadata,omitempty"`
}

// CreateEnvelopeResponse represents the subset of data the API needs to return
// to the caller (envelope id and optional signing URL).
type CreateEnvelopeResponse struct {
	EnvelopeID string  `json:"envelopeId"`
	Status     string  `json:"status"`
	SigningURL *string `json:"signingUrl,omitempty"`
}

// openSignCreateEnvelopeRequest mirrors the expected payload for the OpenSign
// HTTP API. This is intentionally generic; it can be adapted once the concrete
// OpenSign REST surface is finalized.
type openSignCreateEnvelopeRequest struct {
	DocType    string          `json:"docType"`
	Recipients []map[string]any `json:"recipients"`
	Metadata   map[string]any   `json:"metadata,omitempty"`
}

type openSignCreateEnvelopeResponse struct {
	ID         string          `json:"id"`
	Status     string          `json:"status"`
	SigningURL *string         `json:"signingUrl,omitempty"`
	Raw        json.RawMessage `json:"-"`
}

// CreateEnvelope calls the OpenSign API to create a new envelope and records it
// in the envelopes SQL table.
func (s *Service) CreateEnvelope(ctx context.Context, req CreateEnvelopeRequest) (*CreateEnvelopeResponse, error) {
	if s == nil || s.HTTPClient == nil || s.BaseURL == "" || s.APIKey == "" {
		return nil, errors.New("opensign service not configured")
	}

	if req.DocType == "" {
		return nil, errors.New("docType is required")
	}

	payload := openSignCreateEnvelopeRequest{
		DocType:    req.DocType,
		Recipients: req.Recipients,
		Metadata:   req.Metadata,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, s.BaseURL+"/api/envelopes", http.NoBody)
	if err != nil {
		return nil, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+s.APIKey)
	httpReq.Body = io.NopCloser(bytes.NewReader(body))

	resp, err := s.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("opensign create envelope failed with status " + resp.Status)
	}

	var osResp openSignCreateEnvelopeResponse
	dec := json.NewDecoder(resp.Body)
	if err := dec.Decode(&osResp); err != nil {
		return nil, err
	}

	// Persist envelope record to SQL.
	if _, err := s.DB.ExecContext(ctx,
		`INSERT INTO envelopes (firebase_uid, envelope_id, doc_type, status, metadata)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (envelope_id) DO UPDATE SET
		   status = EXCLUDED.status,
		   metadata = EXCLUDED.metadata,
		   updated_at = NOW()`,
		req.FirebaseUID,
		osResp.ID,
		req.DocType,
		osResp.Status,
		req.Metadata,
	); err != nil {
		return nil, err
	}

	return &CreateEnvelopeResponse{
		EnvelopeID: osResp.ID,
		Status:     osResp.Status,
		SigningURL: osResp.SigningURL,
	}, nil
}

// UpdateEnvelopeStatus updates an envelope row from a webhook or polling.
func (s *Service) UpdateEnvelopeStatus(ctx context.Context, envelopeID, status string, metadata map[string]any) error {
	if s == nil || s.DB == nil {
		return errors.New("opensign service not configured")
	}

	if envelopeID == "" {
		return errors.New("envelopeID is required")
	}

	_, err := s.DB.ExecContext(ctx,
		`UPDATE envelopes
		 SET status = $2,
		     metadata = COALESCE($3::jsonb, metadata),
		     updated_at = NOW()
		 WHERE envelope_id = $1`,
		envelopeID,
		status,
		metadata,
	)
	return err
}
