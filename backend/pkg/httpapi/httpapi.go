package httpapi

import (
	"encoding/json"
	"net/http"
)

// ErrorResponse is a standard error envelope for API errors.
type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

// JSON writes a JSON response with status code.
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v == nil {
		return
	}
	_ = json.NewEncoder(w).Encode(v)
}

// Error writes a standardized JSON error.
func Error(w http.ResponseWriter, status int, code, msg string) {
	JSON(w, status, ErrorResponse{Code: code, Message: msg})
}
