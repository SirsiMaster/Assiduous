package sqlclient

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq" // Postgres driver
)

// New returns a *sql.DB connected using DATABASE_URL or a DSN built from env.
func New() (*sql.DB, error) {
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		return sql.Open("postgres", dsn)
	}

	host := envOr("DB_HOST", "localhost")
	port := envOr("DB_PORT", "5432")
	user := envOr("DB_USER", "assiduous")
	pass := os.Getenv("DB_PASSWORD")
	name := envOr("DB_NAME", "assiduous")

	dsn := "host=" + host + " port=" + port + " user=" + user + " password=" + pass + " dbname=" + name + " sslmode=disable"
	log.Printf("[sqlclient] connecting to %s:%s db=%s", host, port, name)
	return sql.Open("postgres", dsn)
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
