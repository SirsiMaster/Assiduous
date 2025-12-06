package deals

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	gfs "cloud.google.com/go/firestore"
	fs "github.com/SirsiMaster/assiduous/backend/pkg/firestore"
)

// Deal represents a single transaction (traditional or micro-flip) in the
// system. It is intentionally minimal; most workflow-specific data lives in
// subcollections (stages, participants, documents).
type Deal struct {
	ID              string                 `firestore:"id" json:"id"`
	EntrySource     string                 `firestore:"entrySource" json:"entrySource"`
	PropertyID      string                 `firestore:"propertyId,omitempty" json:"propertyId,omitempty"`
	ClientUID       string                 `firestore:"clientUid,omitempty" json:"clientUid,omitempty"`
	CreatorUID      string                 `firestore:"creatorUid" json:"creatorUid"`
	StageKey        string                 `firestore:"stageKey" json:"stageKey"`
	StageStatus     string                 `firestore:"stageStatus" json:"stageStatus"`
	MicroflipSnapshot map[string]any      `firestore:"microflipSnapshot,omitempty" json:"microflipSnapshot,omitempty"`
	SearchProfile   map[string]any        `firestore:"searchProfile,omitempty" json:"searchProfile,omitempty"`
	LeadMetadata    map[string]any        `firestore:"leadMetadata,omitempty" json:"leadMetadata,omitempty"`
	CreatedAt       time.Time              `firestore:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time              `firestore:"updatedAt" json:"updatedAt"`
}

// CreateDealInput captures user-provided fields when creating a new deal. It is
// intentionally flexible so we can support multiple entry sources without
// proliferating separate endpoints.
type CreateDealInput struct {
	EntrySource       string          `json:"entrySource"`
	PropertyID        string          `json:"propertyId,omitempty"`
	ClientUID         string          `json:"clientUid,omitempty"`
	MicroflipSnapshot map[string]any `json:"microflipSnapshot,omitempty"`
	SearchProfile     map[string]any `json:"searchProfile,omitempty"`
	LeadMetadata      map[string]any `json:"leadMetadata,omitempty"`
}

// Participant represents a single party in the deal graph (buyer, seller,
// agents, lenders, etc.). It lives in the participants subcollection.
type Participant struct {
	ID        string    `firestore:"id" json:"id"`
	Role      string    `firestore:"role" json:"role"`
	UserUID   string    `firestore:"userUid,omitempty" json:"userUid,omitempty"`
	ContactID string    `firestore:"contactId,omitempty" json:"contactId,omitempty"`
	Name      string    `firestore:"name" json:"name"`
	Email     string    `firestore:"email,omitempty" json:"email,omitempty"`
	Phone     string    `firestore:"phone,omitempty" json:"phone,omitempty"`
	CreatedAt time.Time `firestore:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `firestore:"updatedAt" json:"updatedAt"`
}

// ChecklistItem represents a single actionable item within a stage.
type ChecklistItem struct {
	ID          string     `firestore:"id" json:"id"`
	Label       string     `firestore:"label" json:"label"`
	Description string     `firestore:"description,omitempty" json:"description,omitempty"`
	Required    bool       `firestore:"required" json:"required"`
	Status      string     `firestore:"status" json:"status"`
	OwnerRole   string     `firestore:"ownerRole,omitempty" json:"ownerRole,omitempty"`
	DocumentRef string     `firestore:"documentRef,omitempty" json:"documentRef,omitempty"`
	DueAt       *time.Time `firestore:"dueAt,omitempty" json:"dueAt,omitempty"`
}

// Stage captures one step in the deal lifecycle and its checklist.
type Stage struct {
	ID        string          `firestore:"id" json:"id"`
	Order     int             `firestore:"order" json:"order"`
	Status    string          `firestore:"status" json:"status"`
	Assignee  string          `firestore:"assignee,omitempty" json:"assignee,omitempty"`
	Checklist []ChecklistItem `firestore:"checklist,omitempty" json:"checklist,omitempty"`
	CreatedAt time.Time       `firestore:"createdAt" json:"createdAt"`
	UpdatedAt time.Time       `firestore:"updatedAt" json:"updatedAt"`
}

// DealDocument represents a document attached to a deal (OpenSign envelope,
// upload, Lob letter, etc.).
type DealDocument struct {
	ID         string         `firestore:"id" json:"id"`
	Kind       string         `firestore:"kind" json:"kind"`
	Status     string         `firestore:"status" json:"status"`
	Ref        map[string]any `firestore:"ref,omitempty" json:"ref,omitempty"`
	RequiredBy string         `firestore:"requiredBy,omitempty" json:"requiredBy,omitempty"`
	CreatedAt  time.Time      `firestore:"createdAt" json:"createdAt"`
	UpdatedAt  time.Time      `firestore:"updatedAt" json:"updatedAt"`
}

// allowedEntrySources defines the canonical entry sources we support.
var allowedEntrySources = map[string]bool{
	"property": true,
	"client":   true,
	"seller":   true,
	"other":    true,
}

// canonicalStageOrder defines the linear stage ordering used for steppers and
// default seeding.
var canonicalStageOrder = []string{
	"intake",
	"underwriting",
	"offer",
	"contract",
	"preclose",
	"close",
	"postclose",
}

// CreateDeal creates a new deal document in Firestore. The creatorUID is taken
// from the authenticated user making the request.
func CreateDeal(ctx context.Context, projectID, creatorUID string, in CreateDealInput) (*Deal, error) {
	if projectID == "" {
		return nil, fmt.Errorf("projectID is required")
	}
	if creatorUID == "" {
		return nil, fmt.Errorf("creatorUID is required")
	}
	if !allowedEntrySources[in.EntrySource] {
		return nil, fmt.Errorf("invalid entrySource: %s", in.EntrySource)
	}

	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	deal := &Deal{
		EntrySource:       in.EntrySource,
		PropertyID:        in.PropertyID,
		ClientUID:         in.ClientUID,
		CreatorUID:        creatorUID,
		StageKey:          "intake",
		StageStatus:       "in_progress",
		MicroflipSnapshot: cloneMap(in.MicroflipSnapshot),
		SearchProfile:     cloneMap(in.SearchProfile),
		LeadMetadata:      cloneMap(in.LeadMetadata),
		CreatedAt:         now,
		UpdatedAt:         now,
	}

	docs := client.Collection("deals")
	ref, _, err := docs.Add(ctx, map[string]any{
		"entrySource":       deal.EntrySource,
		"propertyId":        deal.PropertyID,
		"clientUid":         deal.ClientUID,
		"creatorUid":        deal.CreatorUID,
		"stageKey":          deal.StageKey,
		"stageStatus":       deal.StageStatus,
		"microflipSnapshot": deal.MicroflipSnapshot,
		"searchProfile":     deal.SearchProfile,
		"leadMetadata":      deal.LeadMetadata,
		"createdAt":         deal.CreatedAt,
		"updatedAt":         deal.UpdatedAt,
	})
	if err != nil {
		return nil, err
	}

	deal.ID = ref.ID
	if _, err := ref.Set(ctx, map[string]any{"id": deal.ID}, fs.MergeAll()); err != nil {
		return nil, err
	}

	// Best-effort seeding of default stages so the UI can immediately render a
	// stage graph and checklist. Failures are logged but do not block deal
	// creation.
	if err := seedDefaultStages(ctx, projectID, deal.ID, now); err != nil {
		log.Printf("[deals] failed to seed default stages for deal %s: %v", deal.ID, err)
	}

	return deal, nil
}

// GetDeal retrieves a deal by id.
func GetDeal(ctx context.Context, projectID, id string) (*Deal, error) {
	if projectID == "" || id == "" {
		return nil, fmt.Errorf("projectID and id are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}
	doc, err := client.Collection("deals").Doc(id).Get(ctx)
	if err != nil {
		return nil, err
	}
	var d Deal
	if err := doc.DataTo(&d); err != nil {
		return nil, err
	}
	// ensure ID field is populated even if missing in stored data
	if d.ID == "" {
		d.ID = doc.Ref.ID
	}
	return &d, nil
}

// ListDealsForUser returns deals that the given user is directly involved in
// as creator, client, or participant. This is intentionally conservative and
// optimized for dashboard views rather than bulk reporting.
func ListDealsForUser(ctx context.Context, projectID, uid string) ([]*Deal, error) {
	if projectID == "" || uid == "" {
		return nil, fmt.Errorf("projectID and uid are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	out := make([]*Deal, 0, 32)
	seen := make(map[string]bool)

	// Helper to materialize a deal by id if we haven't already.
	addDealByID := func(id string) {
		if id == "" || seen[id] {
			return
		}
		doc, err := client.Collection("deals").Doc(id).Get(ctx)
		if err != nil {
			return
		}
		var d Deal
		if err := doc.DataTo(&d); err != nil {
			return
		}
		if d.ID == "" {
			d.ID = doc.Ref.ID
		}
		seen[d.ID] = true
		out = append(out, &d)
	}

	// 1) Deals created by the user.
	q := client.Collection("deals").Where("creatorUid", "==", uid)
	snap, err := q.Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	for _, doc := range snap {
		var d Deal
		if err := doc.DataTo(&d); err != nil {
			continue
		}
		if d.ID == "" {
			d.ID = doc.Ref.ID
		}
		if seen[d.ID] {
			continue
		}
		seen[d.ID] = true
		out = append(out, &d)
	}

	// 2) Deals where the user is explicitly the client.
	q = client.Collection("deals").Where("clientUid", "==", uid)
	snap, err = q.Documents(ctx).GetAll()
	if err != nil {
		// Non-fatal; return what we have so far.
		log.Printf("[deals] ListDealsForUser clientUid query failed for %s: %v", uid, err)
	} else {
		for _, doc := range snap {
			var d Deal
			if err := doc.DataTo(&d); err != nil {
				continue
			}
			if d.ID == "" {
				d.ID = doc.Ref.ID
			}
			if seen[d.ID] {
				continue
			}
			seen[d.ID] = true
			out = append(out, &d)
		}
	}

	// 3) Deals where the user appears as a participant in the participants
	// subcollection. This uses a collection group query and then fan-outs to
	// fetch the parent deal documents.
	cg := client.CollectionGroup("participants").Where("userUid", "==", uid)
	psnap, err := cg.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("[deals] ListDealsForUser participant collectionGroup query failed for %s: %v", uid, err)
		return out, nil
	}
	for _, doc := range psnap {
		// participants are stored under /deals/{dealId}/participants/{id}
		if doc.Ref.Parent == nil || doc.Ref.Parent.Parent == nil {
			continue
		}
		dealID := doc.Ref.Parent.Parent.ID
		addDealByID(dealID)
	}

	return out, nil
}

// IsUserParticipant reports whether the given user appears as a participant
// on the specified deal.
func IsUserParticipant(ctx context.Context, projectID, dealID, uid string) (bool, error) {
	if projectID == "" || dealID == "" || uid == "" {
		return false, fmt.Errorf("projectID, dealID, and uid are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return false, err
	}
	q := client.Collection("deals").Doc(dealID).Collection("participants").
		Where("userUid", "==", uid).Limit(1)
	snap, err := q.Documents(ctx).GetAll()
	if err != nil {
		return false, err
	}
	return len(snap) > 0, nil
}

// ListAllDeals returns all deals in the system. Intended for admin use.
func ListAllDeals(ctx context.Context, projectID string) ([]*Deal, error) {
	if projectID == "" {
		return nil, fmt.Errorf("projectID is required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	snap, err := client.Collection("deals").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	out := make([]*Deal, 0, len(snap))
	for _, doc := range snap {
		var d Deal
		if err := doc.DataTo(&d); err != nil {
			continue
		}
		if d.ID == "" {
			d.ID = doc.Ref.ID
		}
		out = append(out, &d)
	}
	return out, nil
}

// ListStagesForDeal returns all stage documents for a given deal.
func ListStagesForDeal(ctx context.Context, projectID, dealID string) ([]*Stage, error) {
	if projectID == "" || dealID == "" {
		return nil, fmt.Errorf("projectID and dealID are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	snap, err := client.Collection("deals").Doc(dealID).Collection("stages").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	out := make([]*Stage, 0, len(snap))
	for _, doc := range snap {
		var s Stage
		if err := doc.DataTo(&s); err != nil {
			continue
		}
		if s.ID == "" {
			s.ID = doc.Ref.ID
		}
		out = append(out, &s)
	}
	return out, nil
}

// ListParticipantsForDeal returns all participants attached to a deal.
func ListParticipantsForDeal(ctx context.Context, projectID, dealID string) ([]*Participant, error) {
	if projectID == "" || dealID == "" {
		return nil, fmt.Errorf("projectID and dealID are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	snap, err := client.Collection("deals").Doc(dealID).Collection("participants").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	out := make([]*Participant, 0, len(snap))
	for _, doc := range snap {
		var p Participant
		if err := doc.DataTo(&p); err != nil {
			continue
		}
		if p.ID == "" {
			p.ID = doc.Ref.ID
		}
		out = append(out, &p)
	}
	return out, nil
}

// ListDocumentsForDeal returns all documents attached to a deal.
func ListDocumentsForDeal(ctx context.Context, projectID, dealID string) ([]*DealDocument, error) {
	if projectID == "" || dealID == "" {
		return nil, fmt.Errorf("projectID and dealID are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	snap, err := client.Collection("deals").Doc(dealID).Collection("documents").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	out := make([]*DealDocument, 0, len(snap))
	for _, doc := range snap {
		var d DealDocument
		if err := doc.DataTo(&d); err != nil {
			continue
		}
		if d.ID == "" {
			d.ID = doc.Ref.ID
		}
		out = append(out, &d)
	}
	return out, nil
}

// UpsertParticipant adds a new participant to a deal (or updates an existing
// one when id is provided). For v1 this performs a simple overwrite.
func UpsertParticipant(ctx context.Context, projectID, dealID string, in Participant) (*Participant, error) {
	if projectID == "" || dealID == "" {
		return nil, fmt.Errorf("projectID and dealID are required")
	}
	if strings.TrimSpace(in.Role) == "" {
		return nil, fmt.Errorf("participant role is required")
	}
	if strings.TrimSpace(in.Name) == "" {
		return nil, fmt.Errorf("participant name is required")
	}

	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	col := client.Collection("deals").Doc(dealID).Collection("participants")
	var ref *gfs.DocumentRef
	if in.ID == "" {
		ref = col.NewDoc()
		in.ID = ref.ID
		in.CreatedAt = now
	} else {
		ref = col.Doc(in.ID)
		if in.CreatedAt.IsZero() {
			in.CreatedAt = now
		}
	}
	in.UpdatedAt = now

	if _, err := ref.Set(ctx, in); err != nil {
		return nil, err
	}
	return &in, nil
}

// AddDealDocument attaches a new document record to the given deal.
func AddDealDocument(ctx context.Context, projectID, dealID string, in DealDocument) (*DealDocument, error) {
	if projectID == "" || dealID == "" {
		return nil, fmt.Errorf("projectID and dealID are required")
	}
	if strings.TrimSpace(in.Kind) == "" {
		return nil, fmt.Errorf("document kind is required")
	}

	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	col := client.Collection("deals").Doc(dealID).Collection("documents")
	ref := col.NewDoc()
	in.ID = ref.ID
	in.CreatedAt = now
	in.UpdatedAt = now
	if in.Status == "" {
		in.Status = "draft"
	}

	if _, err := ref.Set(ctx, in); err != nil {
		return nil, err
	}
	return &in, nil
}

// UpdateStageChecklist updates the status of checklist items for a single
// stage. It also updates the stage status when all required items are done.
func UpdateStageChecklist(ctx context.Context, projectID, dealID, stageKey string, updates map[string]string) (*Stage, error) {
	if projectID == "" || dealID == "" || strings.TrimSpace(stageKey) == "" {
		return nil, fmt.Errorf("projectID, dealID, and stageKey are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return nil, err
	}

	stageRef := client.Collection("deals").Doc(dealID).Collection("stages").Doc(stageKey)
	doc, err := stageRef.Get(ctx)
	if err != nil {
		return nil, err
	}
	var stage Stage
	if err := doc.DataTo(&stage); err != nil {
		return nil, err
	}
	if stage.ID == "" {
		stage.ID = doc.Ref.ID
	}

	// Apply checklist status updates.
	if len(stage.Checklist) > 0 && len(updates) > 0 {
		for i := range stage.Checklist {
			id := stage.Checklist[i].ID
			if id == "" {
				continue
			}
			if newStatus, ok := updates[id]; ok {
				stage.Checklist[i].Status = newStatus
			}
		}
	}

	// If all required items are done, mark the stage completed.
	allRequiredDone := true
	for _, item := range stage.Checklist {
		if item.Required && item.Status != "done" {
			allRequiredDone = false
			break
		}
	}
	if allRequiredDone && len(stage.Checklist) > 0 {
		stage.Status = "completed"
	}
	stage.UpdatedAt = time.Now()

	if _, err := stageRef.Set(ctx, stage); err != nil {
		return nil, err
	}

	// Keep the parent deal in sync with the latest stage status, but do not
	// auto-advance stageKey here.
	dealRef := client.Collection("deals").Doc(dealID)
	if _, err := dealRef.Set(ctx, map[string]any{
		"stageStatus": stage.Status,
		"updatedAt":   stage.UpdatedAt,
	}, fs.MergeAll()); err != nil {
		log.Printf("[deals] failed to sync deal stageStatus for %s: %v", dealID, err)
	}

	return &stage, nil
}

// seedDefaultStages writes a conservative default set of stages for the given
// deal so that the UI can immediately render a stage graph.
func seedDefaultStages(ctx context.Context, projectID, dealID string, now time.Time) error {
	if projectID == "" || dealID == "" {
		return fmt.Errorf("projectID and dealID are required")
	}
	client, err := fs.Client(ctx, projectID)
	if err != nil {
		return err
	}

	stagesCol := client.Collection("deals").Doc(dealID).Collection("stages")
	batch := client.Batch()

	for idx, key := range canonicalStageOrder {
		stage := Stage{
			ID:        key,
			Order:     idx,
			Status:    "not_started",
			Assignee:  "agent",
			Checklist: nil,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if key == "intake" {
			stage.Status = "in_progress"
			stage.Assignee = "client"
			stage.Checklist = []ChecklistItem{
				{
					ID:        "confirm-intent",
					Label:     "Confirm your investing intent and timeline",
					Required:  true,
					Status:    "todo",
					OwnerRole: "client",
				},
				{
					ID:        "confirm-participants",
					Label:     "Confirm who is involved (agents, partners)",
					Required:  true,
					Status:    "todo",
					OwnerRole: "client",
				},
				{
					ID:        "review-microflip",
					Label:     "Review micro-flip analysis and risk profile",
					Required:  false,
					Status:    "todo",
					OwnerRole: "client",
				},
			}
		}
		ref := stagesCol.Doc(key)
		batch.Set(ref, stage)
	}

	_, err = batch.Commit(ctx)
	return err
}

// cloneMap makes a shallow copy of a map[string]any so callers can safely
// mutate their inputs after CreateDeal is called without affecting stored data.
func cloneMap(in map[string]any) map[string]any {
	if in == nil {
		return nil
	}
	out := make(map[string]any, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}
