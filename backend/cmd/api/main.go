package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	gfs "cloud.google.com/go/firestore"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/SirsiMaster/assiduous/backend/pkg/ai"
	"github.com/SirsiMaster/assiduous/backend/pkg/auth"
	"github.com/SirsiMaster/assiduous/backend/pkg/billing"
	"github.com/SirsiMaster/assiduous/backend/pkg/config"
	"github.com/SirsiMaster/assiduous/backend/pkg/entitlements"
	"github.com/SirsiMaster/assiduous/backend/pkg/firestore"
	"github.com/SirsiMaster/assiduous/backend/pkg/httpapi"
	"github.com/SirsiMaster/assiduous/backend/pkg/kms"
	"github.com/SirsiMaster/assiduous/backend/pkg/listings"
	"github.com/SirsiMaster/assiduous/backend/pkg/lob"
	"github.com/SirsiMaster/assiduous/backend/pkg/microflip"
	"github.com/SirsiMaster/assiduous/backend/pkg/opensign"
	"github.com/SirsiMaster/assiduous/backend/pkg/plaid"
	"github.com/SirsiMaster/assiduous/backend/pkg/sqlclient"
	"github.com/SirsiMaster/assiduous/backend/pkg/deals"
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

	microflipEngine := microflip.NewEngine()
	listingsRegistry := listings.NewRegistry()

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(auth.Middleware)

	// Simple health endpoint for Cloud Run and monitoring.
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		httpapi.JSON(w, http.StatusOK, map[string]any{
			"status":    "ok",
			"env":       cfg.Env,
			"projectId": cfg.ProjectID,
		})
	})

	// MLS agent configuration endpoints
	r.Route("/api/mls", func(r chi.Router) {
		// GET /api/mls/connection
		// Returns the current agent's MLS connection metadata. Admins may pass
		// ?agentId=UID to inspect a specific agent.
		r.Get("/connection", func(w http.ResponseWriter, r *http.Request) {
			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			targetUID := uc.UID
			if uc.Role == "admin" {
				if q := r.URL.Query().Get("agentId"); q != "" {
					targetUID = q
				}
			}
			if targetUID == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "agentId is required")
				return
			}

			conn, err := listings.GetAgentMLSConnection(r.Context(), cfg.ProjectID, targetUID)
			if err != nil {
				log.Printf("[mls] GetAgentMLSConnection error for %s: %v", targetUID, err)
				httpapi.Error(w, http.StatusInternalServerError, "mls_error", "failed to load MLS connection")
				return
			}

			if conn == nil {
				httpapi.JSON(w, http.StatusOK, map[string]any{"connection": nil})
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"connection": conn})
		})

		// PUT /api/mls/connection
		// Upserts MLS connection metadata for the current agent. Admins can set
		// configuration on behalf of an agent by including agentUid in the body.
		r.Put("/connection", func(w http.ResponseWriter, r *http.Request) {
			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			// Only agents and admins may manage MLS connections.
			if uc.Role != "agent" && uc.Role != "admin" {
				httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient role to manage MLS connection")
				return
			}

			var body struct {
				AgentUID     string `json:"agentUid,omitempty"`
				Board        string `json:"board"`
				MLSAgentID   string `json:"mlsAgentId"`
				MLSOfficeID  string `json:"mlsOfficeId"`
				DefaultCity  string `json:"defaultCity"`
				DefaultState string `json:"defaultState"`
				Enabled      bool   `json:"enabled"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}

			agentUID := body.AgentUID
			if agentUID == "" || uc.Role == "agent" {
				agentUID = uc.UID
			}
			if agentUID == "" {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "agentUid is required")
				return
			}

			conn := &listings.AgentMLSConnection{
				AgentUID:     agentUID,
				Board:        strings.TrimSpace(body.Board),
				MLSAgentID:   strings.TrimSpace(body.MLSAgentID),
				MLSOfficeID:  strings.TrimSpace(body.MLSOfficeID),
				DefaultCity:  strings.TrimSpace(body.DefaultCity),
				DefaultState: strings.TrimSpace(body.DefaultState),
				Enabled:      body.Enabled,
			}

			if err := listings.UpsertAgentMLSConnection(r.Context(), cfg.ProjectID, conn); err != nil {
				log.Printf("[mls] UpsertAgentMLSConnection error for %s: %v", agentUID, err)
				httpapi.Error(w, http.StatusInternalServerError, "mls_error", "failed to save MLS connection")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"connection": conn})
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
				"keyName":    os.Getenv("KMS_KEY_NAME"),
				"keyVersion": "", // Optional: can be populated when using versioned keys
			})
		})
	})

	// Listings ingest endpoints (external property providers)
	// NOTE: This surface is intentionally low-level and primarily driven by
	// internal operators / schedulers rather than public clients.
	
	r.Route("/api/listings", func(r chi.Router) {
		// GET /api/listings/providers
		// Returns the configured providers and whether they are currently
		// enabled. This is primarily used by the admin UI.
					
		r.Get("/providers", func(w http.ResponseWriter, r *http.Request) {
			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			if uc.Role != "admin" {
				httpapi.Error(w, http.StatusForbidden, "forbidden", "admin role required")
				return
			}

			providers := listingsRegistry.Providers()
			out := make([]map[string]any, 0, len(providers))
			for _, p := range providers {
				out = append(out, map[string]any{
					"key":     string(p.Key()),
					"name":    p.DisplayName(),
					"enabled": p.Enabled(),
				})
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"providers": out})
		})

		// POST /api/listings/ingest/{provider}
		// Triggers a one-off ingest run from a configured provider. This is
		// restricted to admin/dev roles and is typically invoked by a
		// Cloud Scheduler job or an internal operator.
		r.Post("/ingest/{provider}", func(w http.ResponseWriter, r *http.Request) {
			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			if uc.Role != "admin" && uc.Role != "agent" {
				// For now, restrict to staff-like roles; can be tightened to dev/admin only.
				httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient role to trigger ingest")
				return
			}

			providerKeyStr := chi.URLParam(r, "provider")
			pk := listings.ProviderKey(strings.ToLower(providerKeyStr))
			prov, ok := listingsRegistry.Get(pk)
			if !ok {
				httpapi.Error(w, http.StatusNotFound, "unknown_provider", "unknown listings provider")
				return
			}

			if !prov.Enabled() {
				httpapi.Error(w, http.StatusServiceUnavailable, "provider_not_configured", "provider is not configured; set API credentials and base URL")
				return
			}

			var body struct {
				Since       *time.Time             `json:"since,omitempty"`
				Region      *listings.RegionFilter `json:"region,omitempty"`
				Limit       int                    `json:"limit,omitempty"`
				MaxPages    int                    `json:"maxPages,omitempty"`
				IncludeSold bool                   `json:"includeSold,omitempty"`
				AgentUID    string                 `json:"agentUid,omitempty"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil && err != io.EOF {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}

			params := listings.FetchParams{
				Limit:       body.Limit,
				MaxPages:    body.MaxPages,
				IncludeSold: body.IncludeSold,
			}
			if body.Since != nil {
				params.Since = *body.Since
			}
			if body.Region != nil {
				params.Region = *body.Region
			}
			// If this is an MLS ingest scoped to a specific agent and no explicit
			// region was provided, fall back to that agent's MLS defaults.
			if params.Region == (listings.RegionFilter{}) && body.AgentUID != "" && pk == listings.ProviderMLS {
				if conn, err := listings.GetAgentMLSConnection(r.Context(), cfg.ProjectID, body.AgentUID); err == nil && conn != nil {
					if conn.DefaultCity != "" || conn.DefaultState != "" {
						params.Region = listings.RegionFilter{
							City:  conn.DefaultCity,
							State: conn.DefaultState,
						}
					}
				}
			}

			res, err := prov.FetchListings(r.Context(), params)
			if err != nil {
				if errors.Is(err, listings.ErrNotConfigured) {
					httpapi.Error(w, http.StatusServiceUnavailable, "provider_not_configured", "provider is not yet implemented or configured")
					return
				}
				log.Printf("[listings] ingest error for provider %s: %v", prov.Key(), err)
				httpapi.Error(w, http.StatusInternalServerError, "ingest_error", "failed to fetch listings from provider")
				return
			}

			// Normalize into Firestore properties collection. This helper is
			// intentionally conservative and uses Merge semantics so existing
			// documents created by legacy flows are not clobbered.
			summary, err := listings.UpsertExternalListingsToFirestore(r.Context(), cfg.ProjectID, res)
			if err != nil {
				log.Printf("[listings] Firestore upsert error for provider %s: %v", prov.Key(), err)
				httpapi.Error(w, http.StatusInternalServerError, "ingest_persist_error", "failed to persist listings into Firestore")
				return
			}

			// Record a lightweight sync heartbeat for agent-scoped MLS ingests so
			// admin tooling can display "last MLS sync" per agent.
			if body.AgentUID != "" && pk == listings.ProviderMLS {
				if err := listings.TouchAgentMLSLastSynced(r.Context(), cfg.ProjectID, body.AgentUID, time.Now()); err != nil {
					log.Printf("[listings] failed to touch MLS lastSyncedAt for agent %s: %v", body.AgentUID, err)
				}
			}

			resp := map[string]any{
				"provider": string(res.Provider),
				"fetched":  len(res.Listings),
				"nextPage": res.NextPage,
			}
			if summary != nil {
				resp["attempted"] = summary.Attempted
				resp["created"] = summary.Created
				resp["updated"] = summary.Updated
				resp["skipped"] = summary.Skipped
			}
			httpapi.JSON(w, http.StatusOK, resp)
		})
	})

	// Deal graph endpoints
	r.Route("/api/deals", func(r chi.Router) {
		// POST /api/deals
		// Creates a new deal from any entry path (property-led, client-led, seller-led).
		// For v1 we primarily support property-led entry from the client portal.
		//
		// Body (example):
		// { "entrySource": "property", "propertyId": "mls_123" }
		//
		// The creatorUid is taken from the authenticated user.
			
			r.Post("/", func(w http.ResponseWriter, r *http.Request) {
				uc := auth.FromContext(r.Context())
				if uc == nil {
					httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
					return
				}

				var body deals.CreateDealInput
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
					return
				}
				body.EntrySource = strings.TrimSpace(strings.ToLower(body.EntrySource))
				if body.EntrySource == "" {
					body.EntrySource = "property"
				}
				// If this is a client-led deal and no explicit clientUid is provided,
				// default to the current user.
				if body.EntrySource == "client" && body.ClientUID == "" {
					body.ClientUID = uc.UID
				}

				deal, err := deals.CreateDeal(r.Context(), cfg.ProjectID, uc.UID, body)
				if err != nil {
					log.Printf("[deals] CreateDeal error for user %s: %v", uc.UID, err)
					httpapi.Error(w, http.StatusBadRequest, "deal_create_failed", err.Error())
					return
				}

				httpapi.JSON(w, http.StatusCreated, map[string]any{"deal": deal})
			})

		// GET /api/deals
		// Returns deals created by the current user. Future iterations can expand
		// to include deals where the user is a participant.
			r.Get("/", func(w http.ResponseWriter, r *http.Request) {
				uc := auth.FromContext(r.Context())
				if uc == nil {
					httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
					return
				}

				var (
					items []*deals.Deal
					err   error
				)
				if uc.Role == "admin" {
					items, err = deals.ListAllDeals(r.Context(), cfg.ProjectID)
				} else {
					items, err = deals.ListDealsForUser(r.Context(), cfg.ProjectID, uc.UID)
				}
				if err != nil {
					log.Printf("[deals] ListDeals error for user %s (role=%s): %v", uc.UID, uc.Role, err)
					httpapi.Error(w, http.StatusInternalServerError, "deal_list_failed", "failed to list deals")
					return
				}
				httpapi.JSON(w, http.StatusOK, map[string]any{"deals": items})
			})

		// GET /api/deals/{id}
		// Loads a single deal and performs basic access checks: creator, client,
		// or admin can view.
			r.Get("/{id}", func(w http.ResponseWriter, r *http.Request) {
				uc := auth.FromContext(r.Context())
				if uc == nil {
					httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
					return
				}

				id := chi.URLParam(r, "id")
				if strings.TrimSpace(id) == "" {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "deal id is required")
					return
				}

				deal, err := deals.GetDeal(r.Context(), cfg.ProjectID, id)
				if err != nil {
					log.Printf("[deals] GetDeal error for id %s: %v", id, err)
					httpapi.Error(w, http.StatusNotFound, "deal_not_found", "deal not found")
					return
				}

				// Basic access control: creator, client, participants, plus admins.
				allowed := uc.Role == "admin" || deal.CreatorUID == uc.UID || deal.ClientUID == uc.UID
				if !allowed {
					isPart, err := deals.IsUserParticipant(r.Context(), cfg.ProjectID, deal.ID, uc.UID)
					if err != nil {
						log.Printf("[deals] IsUserParticipant check failed for deal %s, user %s: %v", deal.ID, uc.UID, err)
					}
					if !isPart {
						httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient access to this deal")
						return
					}
				}

				// Load associated graph data (stages, participants, documents). These are
				// best-effort; failures are logged but do not block the core deal.
				stages, err := deals.ListStagesForDeal(r.Context(), cfg.ProjectID, deal.ID)
				if err != nil {
					log.Printf("[deals] ListStagesForDeal error for deal %s: %v", deal.ID, err)
				}
				participants, err := deals.ListParticipantsForDeal(r.Context(), cfg.ProjectID, deal.ID)
				if err != nil {
					log.Printf("[deals] ListParticipantsForDeal error for deal %s: %v", deal.ID, err)
				}
				documents, err := deals.ListDocumentsForDeal(r.Context(), cfg.ProjectID, deal.ID)
				if err != nil {
					log.Printf("[deals] ListDocumentsForDeal error for deal %s: %v", deal.ID, err)
				}

				resp := map[string]any{
					"deal":        deal,
					"stages":      stages,
					"participants": participants,
					"documents":   documents,
				}
				httpapi.JSON(w, http.StatusOK, resp)
			})

		// POST /api/deals/{id}/participants
		// Adds or updates a participant for the given deal. For v1 we allow the
		// deal creator or an admin to manage participants.
			r.Post("/{id}/participants", func(w http.ResponseWriter, r *http.Request) {
				uc := auth.FromContext(r.Context())
				if uc == nil {
					httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
					return
				}

				dealID := chi.URLParam(r, "id")
				if strings.TrimSpace(dealID) == "" {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "deal id is required")
					return
				}

				// Ensure the user has access to the deal first.
				deal, err := deals.GetDeal(r.Context(), cfg.ProjectID, dealID)
				if err != nil {
					httpapi.Error(w, http.StatusNotFound, "deal_not_found", "deal not found")
					return
				}
				allowed := uc.Role == "admin" || deal.CreatorUID == uc.UID || deal.ClientUID == uc.UID
				if !allowed {
					isPart, err := deals.IsUserParticipant(r.Context(), cfg.ProjectID, dealID, uc.UID)
					if err != nil {
						log.Printf("[deals] IsUserParticipant check failed for deal %s, user %s: %v", dealID, uc.UID, err)
					}
					if !isPart {
						httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient access to this deal")
						return
					}
				}

				var in deals.Participant
				if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
					return
				}

				p, err := deals.UpsertParticipant(r.Context(), cfg.ProjectID, dealID, in)
				if err != nil {
					log.Printf("[deals] UpsertParticipant error for deal %s: %v", dealID, err)
					httpapi.Error(w, http.StatusBadRequest, "participant_upsert_failed", err.Error())
					return
				}

				httpapi.JSON(w, http.StatusOK, map[string]any{"participant": p})
			})

		// POST /api/deals/{id}/documents
		// Attaches a document record (OpenSign envelope, Lob letter, upload, etc.)
		// to the deal. For v1 we allow creator and admins.
			r.Post("/{id}/documents", func(w http.ResponseWriter, r *http.Request) {
				uc := auth.FromContext(r.Context())
				if uc == nil {
					httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
					return
				}

				dealID := chi.URLParam(r, "id")
				if strings.TrimSpace(dealID) == "" {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "deal id is required")
					return
				}

				deal, err := deals.GetDeal(r.Context(), cfg.ProjectID, dealID)
				if err != nil {
					httpapi.Error(w, http.StatusNotFound, "deal_not_found", "deal not found")
					return
				}
				allowed := uc.Role == "admin" || deal.CreatorUID == uc.UID || deal.ClientUID == uc.UID
				if !allowed {
					isPart, err := deals.IsUserParticipant(r.Context(), cfg.ProjectID, dealID, uc.UID)
					if err != nil {
						log.Printf("[deals] IsUserParticipant check failed for deal %s, user %s: %v", dealID, uc.UID, err)
					}
					if !isPart {
						httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient access to this deal")
						return
					}
				}

				var in deals.DealDocument
				if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
					return
				}

				d, err := deals.AddDealDocument(r.Context(), cfg.ProjectID, dealID, in)
				if err != nil {
					log.Printf("[deals] AddDealDocument error for deal %s: %v", dealID, err)
					httpapi.Error(w, http.StatusBadRequest, "document_attach_failed", err.Error())
					return
				}

				httpapi.JSON(w, http.StatusOK, map[string]any{"document": d})
			})

		// POST /api/deals/{id}/stages
		// Updates checklist item statuses for a stage. This is primarily called by
		// the client portal when a user completes intake tasks.
			r.Post("/{id}/stages", func(w http.ResponseWriter, r *http.Request) {
				uc := auth.FromContext(r.Context())
				if uc == nil {
					httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
					return
				}

				dealID := chi.URLParam(r, "id")
				if strings.TrimSpace(dealID) == "" {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "deal id is required")
					return
				}

				deal, err := deals.GetDeal(r.Context(), cfg.ProjectID, dealID)
				if err != nil {
					httpapi.Error(w, http.StatusNotFound, "deal_not_found", "deal not found")
					return
				}
				if uc.Role != "admin" && deal.CreatorUID != uc.UID && deal.ClientUID != uc.UID {
					httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient access to this deal")
					return
				}

				var body struct {
					StageKey string            `json:"stageKey"`
					Items    map[string]string `json:"items"`
				}
				if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
					return
				}
				body.StageKey = strings.TrimSpace(strings.ToLower(body.StageKey))
				if body.StageKey == "" {
					body.StageKey = deal.StageKey
				}
				if body.StageKey == "" {
					httpapi.Error(w, http.StatusBadRequest, "invalid_request", "stageKey is required")
					return
				}

				stage, err := deals.UpdateStageChecklist(r.Context(), cfg.ProjectID, dealID, body.StageKey, body.Items)
				if err != nil {
					log.Printf("[deals] UpdateStageChecklist error for deal %s: %v", dealID, err)
					httpapi.Error(w, http.StatusBadRequest, "stage_update_failed", err.Error())
					return
				}

				httpapi.JSON(w, http.StatusOK, map[string]any{"stage": stage})
			})
	})

	// Micro-flip analysis endpoints
	r.Route("/api/microflip", func(r chi.Router) {
		// POST /api/microflip/analyze
		// Body: DealInput JSON, returns DealAnalysis.
		r.Post("/analyze", func(w http.ResponseWriter, r *http.Request) {
			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}

			// Enforce active subscription for micro-flip engine.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[microflip] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for micro-flip analysis")
				return
			}

			var in microflip.DealInput
			if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
				httpapi.Error(w, http.StatusBadRequest, "invalid_request", "invalid JSON body")
				return
			}

			// Basic input sanity defaults.
			if in.HoldingPeriod <= 0 {
				in.HoldingPeriod = 90
			}
			if in.FinancingType == "" {
				in.FinancingType = "cash"
			}

			analysis := microflipEngine.AnalyzeDeal(in)
			httpapi.JSON(w, http.StatusOK, analysis)
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

			// Enforce active subscription for AI features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[ai] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for AI features")
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

			// Enforce active subscription for OpenSign features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[opensign] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for e-sign features")
				return
			}

			var req struct {
				DocType    string           `json:"docType"`
				Recipients []map[string]any `json:"recipients"`
				Metadata   map[string]any   `json:"metadata,omitempty"`
				DealID     string           `json:"dealId,omitempty"`
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

			// Optionally attach this envelope to a deal as a DealDocument.
			if req.DealID != "" {
				if _, derr := deals.AddDealDocument(r.Context(), cfg.ProjectID, req.DealID, deals.DealDocument{
					Kind:   "opensign",
					Status: env.Status,
					Ref: map[string]any{
						"envelopeId": env.EnvelopeID,
						"docType":    req.DocType,
					},
				}); derr != nil {
					log.Printf("[deals] failed to attach OpenSign envelope %s to deal %s: %v", env.EnvelopeID, req.DealID, derr)
				}
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

			// Enforce active subscription for OpenSign features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[opensign] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for e-sign features")
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
				EnvelopeID string         `json:"envelopeId"`
				Status     string         `json:"status"`
				Metadata   map[string]any `json:"metadata,omitempty"`
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

			// Enforce active subscription for Lob features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[lob] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for certified mail features")
				return
			}

			var req struct {
				ToAddress  map[string]any `json:"toAddress"`
				TemplateID string         `json:"templateId"`
				DealID     string         `json:"dealId,omitempty"`
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

			// Optionally attach this letter to a deal as a DealDocument.
			if req.DealID != "" {
				if _, derr := deals.AddDealDocument(r.Context(), cfg.ProjectID, req.DealID, deals.DealDocument{
					Kind:   "lob_letter",
					Status: "created",
					Ref: map[string]any{
						"letterId":   letterID,
						"templateId": req.TemplateID,
					},
				}); derr != nil {
					log.Printf("[deals] failed to attach Lob letter %s to deal %s: %v", letterID, req.DealID, derr)
				}
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"letterId": letterID})
		})

		// GET /api/lob/letters
		// Returns recent letters for the current user for operator review.
		r.Get("/letters", func(w http.ResponseWriter, r *http.Request) {
			if lobSvc == nil {
				httpapi.Error(w, http.StatusServiceUnavailable, "lob_unavailable", "Lob service not configured")
				return
			}

			uc := auth.FromContext(r.Context())
			if uc == nil {
				httpapi.Error(w, http.StatusUnauthorized, "unauthorized", "authentication required")
				return
			}
			// Only admins and agents can view certified mail history.
			if uc.Role != "admin" && uc.Role != "agent" {
				httpapi.Error(w, http.StatusForbidden, "forbidden", "insufficient role to view certified mail history")
				return
			}

			// Enforce active subscription for Lob features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[lob] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for certified mail features")
				return
			}

			letters, err := lobSvc.ListLetters(r.Context(), uc.UID, 20)
			if err != nil {
				log.Printf("[lob] ListLetters error: %v", err)
				httpapi.Error(w, http.StatusInternalServerError, "lob_error", "failed to load letters")
				return
			}

			httpapi.JSON(w, http.StatusOK, map[string]any{"letters": letters})
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

			// Enforce active subscription for Plaid features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[plaid] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for banking integrations")
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

			// Enforce active subscription for Plaid features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[plaid] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for banking integrations")
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

			// Enforce active subscription for Plaid features.
			if ok, err := entitlements.HasActiveAssiduousSubscription(r.Context(), cfg.ProjectID, uc.UID); err != nil {
				log.Printf("[plaid] entitlement check failed for user %s: %v", uc.UID, err)
				httpapi.Error(w, http.StatusInternalServerError, "entitlement_error", "failed to verify subscription")
				return
			} else if !ok {
				httpapi.Error(w, http.StatusForbidden, "subscription_required", "active subscription required for banking integrations")
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
				"status":           string(sub.Status),
				"currentPeriodEnd": time.Unix(sub.CurrentPeriodEnd, 0),
			},
		},
	}

	_, err = client.Collection("users").Doc(firebaseUID).Set(ctx, data, gfs.MergeAll)
	return err
}
