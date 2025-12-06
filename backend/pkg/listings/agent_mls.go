package listings

import (
	"context"
	"time"

	fs "github.com/SirsiMaster/assiduous/backend/pkg/firestore"
)

// AgentMLSConnection captures per-agent MLS metadata used by ingest. This is
// intentionally limited to identifiers and preferences (no raw passwords or
// secrets) so we can safely keep it in Firestore.
type AgentMLSConnection struct {
	AgentUID    string    `firestore:"agentUid" json:"agentUid"`
	Board       string    `firestore:"board" json:"board"`                 // e.g. Bright MLS, CRMLS
	MLSAgentID  string    `firestore:"mlsAgentId" json:"mlsAgentId"`       // agent identifier in the MLS
	MLSOfficeID string    `firestore:"mlsOfficeId" json:"mlsOfficeId"`     // brokerage/office id
	DefaultCity string    `firestore:"defaultCity" json:"defaultCity"`     // default search city for this agent
	DefaultState string   `firestore:"defaultState" json:"defaultState"`   // default state/region
	Enabled     bool      `firestore:"enabled" json:"enabled"`
	LastSyncedAt time.Time `firestore:"lastSyncedAt" json:"lastSyncedAt"`
	UpdatedAt   time.Time `firestore:"updatedAt" json:"updatedAt"`
}

// GetAgentMLSConnection loads the MLS connection document for a given agent
// uid from the mls_connections collection. It returns (nil, nil) when no
// connection has been configured yet.
func GetAgentMLSConnection(ctx context.Context, projectID, agentUID string) (*AgentMLSConnection, error) {
	if agentUID == "" {
		return nil, nil
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	doc, err := client.Collection("mls_connections").Doc(agentUID).Get(ctx)
	if err != nil {
		// If the document does not exist we treat it as no configuration rather
		// than an error; callers can present an empty state in the UI.
		if fs.IsNotFound(err) {
			return nil, nil
		}
		return nil, err
	}

	var conn AgentMLSConnection
	if err := doc.DataTo(&conn); err != nil {
		return nil, err
	}
	return &conn, nil
}

// UpsertAgentMLSConnection writes the agent's MLS connection metadata using a
// merge update so we do not clobber unrelated fields if we add them later.
func UpsertAgentMLSConnection(ctx context.Context, projectID string, conn *AgentMLSConnection) error {
	if conn == nil || conn.AgentUID == "" {
		return nil
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return err
	}

	conn.UpdatedAt = time.Now()
	data := map[string]any{
		"agentUid":     conn.AgentUID,
		"board":        conn.Board,
		"mlsAgentId":   conn.MLSAgentID,
		"mlsOfficeId":  conn.MLSOfficeID,
		"defaultCity":  conn.DefaultCity,
		"defaultState": conn.DefaultState,
		"enabled":      conn.Enabled,
		"updatedAt":    conn.UpdatedAt,
	}
	if !conn.LastSyncedAt.IsZero() {
		data["lastSyncedAt"] = conn.LastSyncedAt
	}

	_, err = client.Collection("mls_connections").Doc(conn.AgentUID).Set(ctx, data, fs.MergeAll())
	return err
}

// TouchAgentMLSLastSynced updates only the lastSyncedAt (and updatedAt) fields
// for an agent's MLS connection document. It is safe to call even if the
// document does not yet exist; Firestore will create it with a minimal payload
// that can be enriched later via UpsertAgentMLSConnection.
func TouchAgentMLSLastSynced(ctx context.Context, projectID, agentUID string, ts time.Time) error {
	if projectID == "" || agentUID == "" {
		return nil
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return err
	}
	if ts.IsZero() {
		ts = time.Now()
	}
	_, err = client.Collection("mls_connections").Doc(agentUID).Set(ctx, map[string]any{
		"lastSyncedAt": ts,
		"updatedAt":    ts,
	}, fs.MergeAll())
	return err
}
