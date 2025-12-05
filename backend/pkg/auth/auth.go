package auth

import (
	"context"
	"log"
	"net/http"
	"strings"
	"sync"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

// UserContext captures the authenticated Firebase user and selected claims.
type UserContext struct {
	UID   string
	Email string
	Role  string
	Token *auth.Token
}

var (
	clientOnce sync.Once
	client     *auth.Client
	clientErr  error
)

// getClient initializes (once) and returns the Firebase Auth client.
func getClient(ctx context.Context) (*auth.Client, error) {
	clientOnce.Do(func() {
		// Use Application Default Credentials. On Cloud Run this uses the
		// service account; locally it can use gcloud credentials.
		app, err := firebase.NewApp(ctx, nil, option.WithCredentialsFile(""))
		if err != nil {
			log.Printf("[auth] failed to init Firebase app: %v", err)
			clientErr = err
			return
		}
		client, clientErr = app.Auth(ctx)
	})
	return client, clientErr
}

// VerifyIDToken validates a Firebase ID token and extracts basic user context.
func VerifyIDToken(ctx context.Context, idToken string) (*UserContext, error) {
	c, err := getClient(ctx)
	if err != nil {
		return nil, err
	}
	tok, err := c.VerifyIDToken(ctx, idToken)
	if err != nil {
		return nil, err
	}

	uc := &UserContext{UID: tok.UID, Token: tok}
	if email, ok := tok.Claims["email"].(string); ok {
		uc.Email = email
	}
	if role, ok := tok.Claims["role"].(string); ok {
		uc.Role = role
	}
	return uc, nil
}

// Middleware attaches authenticated user context to the request when a valid
// Firebase ID token is provided via Authorization: Bearer <token> header.
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authz := r.Header.Get("Authorization")
		if authz == "" {
			// No token provided; treat as anonymous request.
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.SplitN(authz, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			// Malformed header; treat as anonymous.
			next.ServeHTTP(w, r)
			return
		}

		ctx := r.Context()
		uc, err := VerifyIDToken(ctx, parts[1])
		if err != nil {
			log.Printf("[auth] token verification failed: %v", err)
			// Do not block the request; downstream handlers can enforce auth where required.
			next.ServeHTTP(w, r)
			return
		}

		ctx = context.WithValue(ctx, userContextKey{}, uc)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// userContextKey is an unexported type used as context key.
type userContextKey struct{}

// FromContext retrieves the UserContext from a request context, if present.
func FromContext(ctx context.Context) *UserContext {
	if v := ctx.Value(userContextKey{}); v != nil {
		if uc, ok := v.(*UserContext); ok {
			return uc
		}
	}
	return nil
}
