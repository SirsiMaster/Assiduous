package httpapi

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// TestJSONWritesStatusAndContentType verifies that JSON sets the status code and
// Content-Type header and emits a valid JSON body.
func TestJSONWritesStatusAndContentType(t *testing.T) {
	rec := httptest.NewRecorder()

	payload := map[string]string{"hello": "world"}
	JSON(rec, http.StatusCreated, payload)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected status %d, got %d", http.StatusCreated, rec.Code)
	}

	if got := rec.Header().Get("Content-Type"); got != "application/json; charset=utf-8" {
		t.Fatalf("expected Content-Type application/json; charset=utf-8, got %q", got)
	}

	var decoded map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &decoded); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}
	if decoded["hello"] != "world" {
		t.Fatalf("expected body[hello] == %q, got %q", "world", decoded["hello"])
	}
}

// TestErrorWritesErrorResponse verifies that Error wraps the code and message
// into an ErrorResponse payload and uses the provided status code.
func TestErrorWritesErrorResponse(t *testing.T) {
	rec := httptest.NewRecorder()

	Error(rec, http.StatusBadRequest, "invalid_request", "something went wrong")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status %d, got %d", http.StatusBadRequest, rec.Code)
	}

	if got := rec.Header().Get("Content-Type"); got != "application/json; charset=utf-8" {
		t.Fatalf("expected Content-Type application/json; charset=utf-8, got %q", got)
	}

	var resp ErrorResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}

	if resp.Code != "invalid_request" {
		t.Errorf("expected Code %q, got %q", "invalid_request", resp.Code)
	}
	if resp.Message != "something went wrong" {
		t.Errorf("expected Message %q, got %q", "something went wrong", resp.Message)
	}
}
