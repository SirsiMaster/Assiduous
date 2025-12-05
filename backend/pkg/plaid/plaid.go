package plaid

import (
	"context"
	"database/sql"
	"errors"
	"os"

	"github.com/plaid/plaid-go/v23/plaid"

	"github.com/SirsiMaster/assiduous/backend/pkg/kms"
)

// Service encapsulates Plaid client + SQL persistence.
type Service struct {
	Client *plaid.APIClient
	DB     *sql.DB
}

// Account represents a simplified Plaid account view returned to callers.
type Account struct {
	ItemID    string `json:"itemId"`
	AccountID string `json:"accountId"`
	Name      string `json:"name"`
	Mask      string `json:"mask"`
	Type      string `json:"type"`
	Subtype   string `json:"subtype"`
}

// NewService constructs a Plaid service from environment variables.
// Required:
//   - PLAID_CLIENT_ID
//   - PLAID_SECRET
//   - PLAID_ENV (sandbox|development|production)
func NewService(db *sql.DB) (*Service, error) {
	clientID := os.Getenv("PLAID_CLIENT_ID")
	secret := os.Getenv("PLAID_SECRET")
	if clientID == "" || secret == "" {
		return nil, errors.New("PLAID_CLIENT_ID/PLAID_SECRET not configured")
	}

	envName := os.Getenv("PLAID_ENV")
	if envName == "" {
		envName = "sandbox"
	}

	var env plaid.Environment
	switch envName {
	case "sandbox":
		env = plaid.Sandbox
	case "development":
		env = plaid.Development
	case "production":
		env = plaid.Production
	default:
		return nil, errors.New("invalid PLAID_ENV, expected sandbox|development|production")
	}

	cfg := plaid.NewConfiguration()
	cfg.AddDefaultHeader("PLAID-CLIENT-ID", clientID)
	cfg.AddDefaultHeader("PLAID-SECRET", secret)
	cfg.UseEnvironment(env)

	client := plaid.NewAPIClient(cfg)

	return &Service{Client: client, DB: db}, nil
}

// CreateLinkToken creates a link token for the given Firebase UID and user name.
func (s *Service) CreateLinkToken(ctx context.Context, firebaseUID, userName string) (string, error) {
	if s == nil || s.Client == nil {
		return "", errors.New("plaid service not configured")
	}

	user := plaid.LinkTokenCreateRequestUser{
		ClientUserId: firebaseUID,
	}

	req := plaid.NewLinkTokenCreateRequest(
		"Assiduous Realty",
		"en",
		[]plaid.CountryCode{plaid.COUNTRYCODE_US},
		user,
	)

	products := []plaid.Products{plaid.PRODUCTS_AUTH}
	req.SetProducts(products)
	
	resp, _, err := s.Client.PlaidApi.LinkTokenCreate(ctx).
		LinkTokenCreateRequest(*req).
		Execute()
	if err != nil {
		return "", err
	}

	return resp.GetLinkToken(), nil
}

// ExchangePublicToken exchanges a short-lived public token for an access token
// and persists the Plaid item + optional accounts.
func (s *Service) ExchangePublicToken(ctx context.Context, firebaseUID, publicToken, institutionName string) error {
	if s == nil || s.Client == nil {
		return errors.New("plaid service not configured")
	}

	req := plaid.NewItemPublicTokenExchangeRequest(publicToken)

	resp, _, err := s.Client.PlaidApi.ItemPublicTokenExchange(ctx).
		ItemPublicTokenExchangeRequest(*req).
		Execute()
	if err != nil {
		return err
	}

	accessToken := resp.GetAccessToken()
	itemID := resp.GetItemId()

	// Encrypt access token with Cloud KMS before persisting.
	ciphertext, err := kms.WrapDEK(ctx, "", []byte(accessToken))
	if err != nil {
		return err
	}

	res, err := s.DB.ExecContext(ctx,
		`INSERT INTO plaid_items (firebase_uid, item_id, access_token_encrypted, institution_name)
		 VALUES ($1, $2, $3::bytea, $4)
		 ON CONFLICT (firebase_uid, item_id) DO UPDATE SET
		   access_token_encrypted = EXCLUDED.access_token_encrypted,
		   institution_name = EXCLUDED.institution_name`,
		firebaseUID,
		itemID,
		ciphertext,
		institutionName,
	)
	if err != nil {
		return err
	}
	_ = res // rows affected not used yet

	return nil
}

// GetAccounts retrieves accounts for all Plaid items linked to the given user
// by decrypting stored access tokens with KMS and calling Plaid /accounts/get.
func (s *Service) GetAccounts(ctx context.Context, firebaseUID string) ([]Account, error) {
	if s == nil || s.Client == nil {
		return nil, errors.New("plaid service not configured")
	}

	rows, err := s.DB.QueryContext(ctx,
		"SELECT item_id, access_token_encrypted FROM plaid_items WHERE firebase_uid = $1",
		firebaseUID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []Account

	for rows.Next() {
		var itemID string
		var ciphertext []byte
		if err := rows.Scan(&itemID, &ciphertext); err != nil {
			return nil, err
		}

		plaintext, err := kms.UnwrapDEK(ctx, "", ciphertext)
		if err != nil {
			return nil, err
		}

		accessToken := string(plaintext)

		req := plaid.NewAccountsGetRequest(accessToken)
		resp, _, err := s.Client.PlaidApi.AccountsGet(ctx).
			AccountsGetRequest(*req).
			Execute()
		if err != nil {
			return nil, err
		}

		for _, acc := range resp.GetAccounts() {
			accounts = append(accounts, Account{
				ItemID:    itemID,
				AccountID: acc.GetAccountId(),
				Name:      acc.GetName(),
				Mask:      acc.GetMask(),
				Type:      string(acc.GetType()),
				Subtype:   string(acc.GetSubtype()),
			})
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return accounts, nil
}
