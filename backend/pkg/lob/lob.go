package lob

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"time"

	lob "github.com/lob/lob-go"
)

// Service wraps Lob client and SQL access for certified mail letters.
type Service struct {
	Client *lob.APIClient
	DB     *sql.DB
	APIKey string
}

// NewService constructs a Lob service using the LOB_API_KEY environment
// variable. The key can be a test or live key depending on environment.
func NewService(db *sql.DB) (*Service, error) {
	apiKey := os.Getenv("LOB_API_KEY")
	if apiKey == "" {
		return nil, errors.New("LOB_API_KEY not configured")
	}

	cfg := lob.NewConfiguration()
	client := lob.NewAPIClient(cfg)

	return &Service{Client: client, DB: db, APIKey: apiKey}, nil
}

// CreateLetterRequest captures the inputs required to generate a certified
// letter via Lob using a pre-defined template.
type CreateLetterRequest struct {
	FirebaseUID string
	ToAddress   map[string]any
	TemplateID  string
}

// LetterSummary represents a simplified view of a Lob letter for operator UIs.
type LetterSummary struct {
	LobLetterID string    `json:"lobLetterId"`
	TemplateID  string    `json:"templateId"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CreateLetter creates a Lob letter and persists the resulting ID to the
// letters table for audit/lookup.
func (s *Service) CreateLetter(ctx context.Context, req CreateLetterRequest) (string, error) {
	if s == nil || s.Client == nil || s.APIKey == "" {
		return "", errors.New("lob service not configured")
	}

	// Construct Lob address parameters from the provided map. For now we expect
	// the map to contain fields compatible with Lob's address object, and we
	// pass it through as JSON for persistence while building a minimal address
	// for the API call.
	name, _ := req.ToAddress["name"].(string)
	line1, _ := req.ToAddress["address_line1"].(string)
	city, _ := req.ToAddress["address_city"].(string)
	state, _ := req.ToAddress["address_state"].(string)
	zip, _ := req.ToAddress["address_zip"].(string)

	lobTo := map[string]interface{}{
		"name":            name,
		"address_line1":   line1,
		"address_city":    city,
		"address_state":   state,
		"address_zip":     zip,
		"address_country": "US",
	}

	// Inject BasicAuth into the context as recommended by the lob-go SDK.
	authCtx := context.WithValue(ctx, lob.ContextBasicAuth, lob.BasicAuth{
		UserName: s.APIKey,
	})

	editable := lob.NewLetterEditableWithDefaults()
	editable.Color = false
	editable.To = lobTo
	editable.File = "{{template:" + req.TemplateID + "}}"

	letter, _, err := s.Client.LettersApi.Create(authCtx).
		LetterEditable(*editable).
		Execute()
	if err != nil {
		return "", err
	}

	_, err = s.DB.ExecContext(ctx,
		`INSERT INTO letters (firebase_uid, lob_letter_id, to_address, template_id, status)
		 VALUES ($1, $2, $3::jsonb, $4, $5)
		 ON CONFLICT (lob_letter_id) DO UPDATE SET
		   to_address = EXCLUDED.to_address,
		   template_id = EXCLUDED.template_id,
		   status = EXCLUDED.status,
		   updated_at = NOW()`,
		req.FirebaseUID,
		letter.Id,
		req.ToAddress,
		req.TemplateID,
		"", // status placeholder; can be expanded once exposed by SDK
	)
	if err != nil {
		return "", err
	}

	return letter.Id, nil
}

// ListLetters returns recent letters for a given Firebase user, ordered by
// most recent first. Limit controls the maximum number of rows returned.
func (s *Service) ListLetters(ctx context.Context, firebaseUID string, limit int) ([]LetterSummary, error) {
	if s == nil || s.DB == nil {
		return nil, errors.New("lob service not configured")
	}
	if firebaseUID == "" {
		return []LetterSummary{}, nil
	}
	if limit <= 0 {
		limit = 20
	}

	rows, err := s.DB.QueryContext(ctx,
		`SELECT lob_letter_id, template_id, status, created_at
		   FROM letters
		  WHERE firebase_uid = $1
		  ORDER BY created_at DESC
		  LIMIT $2`,
		firebaseUID,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	letters := make([]LetterSummary, 0, limit)
	for rows.Next() {
		var l LetterSummary
		if err := rows.Scan(&l.LobLetterID, &l.TemplateID, &l.Status, &l.CreatedAt); err != nil {
			return nil, err
		}
		letters = append(letters, l)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return letters, nil
}
