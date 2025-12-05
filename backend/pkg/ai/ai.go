package ai

import (
	"context"
	"errors"
	"os"
	"strings"

	genai "cloud.google.com/go/vertexai/genai"
)

// Service wraps a Vertex AI GenerativeModel client for Gemini.
type Service struct {
	Client *genai.Client
	Model  *genai.GenerativeModel
}

// NewService constructs a Vertex AI service using the given project and region.
// Model name can be overridden with VERTEX_MODEL_NAME env var; defaults to
// "gemini-1.5-flash".
func NewService(ctx context.Context, projectID, region string) (*Service, error) {
	if projectID == "" || region == "" {
		return nil, errors.New("projectID and region are required for Vertex AI")
	}

	client, err := genai.NewClient(ctx, projectID, region)
	if err != nil {
		return nil, err
	}

	modelName := os.Getenv("VERTEX_MODEL_NAME")
	if modelName == "" {
		modelName = "gemini-1.5-flash"
	}

	mdl := client.GenerativeModel(modelName)
	return &Service{Client: client, Model: mdl}, nil
}

// Explain takes a natural-language prompt and returns a text explanation from
// the configured Gemini model.
func (s *Service) Explain(ctx context.Context, prompt string) (string, error) {
	if s == nil || s.Client == nil || s.Model == nil {
		return "", errors.New("ai service not configured")
	}
	if strings.TrimSpace(prompt) == "" {
		return "", errors.New("prompt is required")
	}

	resp, err := s.Model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}
	if resp == nil || len(resp.Candidates) == 0 {
		return "", errors.New("no candidates returned from model")
	}

	var sb strings.Builder
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			// genai.Text is an alias for string
			sb.WriteString(string(txt))
		}
	}

	return sb.String(), nil
}
