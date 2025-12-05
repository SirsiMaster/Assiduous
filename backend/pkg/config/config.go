package config

import (
	"log"
	"os"
)

// AppConfig holds shared configuration for backend services.
type AppConfig struct {
	Env         string
	ProjectID   string
	Region      string
	// Future: SQL DSN, Stripe keys, Plaid keys, etc. loaded via env/Secret Manager.
}

// Load reads configuration from environment variables.
func Load() AppConfig {
	cfg := AppConfig{
		Env:       getenv("APP_ENV", "dev"),
		ProjectID: getenv("GCP_PROJECT_ID", os.Getenv("GOOGLE_CLOUD_PROJECT")),
		Region:    getenv("GCP_REGION", "us-central1"),
	}

	if cfg.ProjectID == "" {
		log.Println("[config] WARNING: GCP_PROJECT_ID/GOOGLE_CLOUD_PROJECT not set; Firestore/Vertex may fail until configured")
	}

	return cfg
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
