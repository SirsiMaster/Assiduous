-- Cloud SQL schema for Assiduous backend (PostgreSQL recommended)

-- Stripe customers mapped to Firebase users
CREATE TABLE IF NOT EXISTS stripe_customers (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  customer_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe subscriptions
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id SERIAL PRIMARY KEY,
  subscription_id TEXT NOT NULL UNIQUE,
  firebase_uid TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe webhook events (for audit/debug)
CREATE TABLE IF NOT EXISTS stripe_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plaid items and accounts
CREATE TABLE IF NOT EXISTS plaid_items (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  item_id TEXT NOT NULL,
  access_token_encrypted BYTEA NOT NULL,
  institution_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  plaid_item_id INTEGER NOT NULL REFERENCES plaid_items(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT,
  mask TEXT,
  type TEXT,
  subtype TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lob letters
CREATE TABLE IF NOT EXISTS letters (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  lob_letter_id TEXT NOT NULL UNIQUE,
  to_address JSONB NOT NULL,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OpenSign envelopes
CREATE TABLE IF NOT EXISTS envelopes (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  envelope_id TEXT NOT NULL UNIQUE,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generic audit log
CREATE TABLE IF NOT EXISTS audit_events (
  id SERIAL PRIMARY KEY,
  firebase_uid TEXT,
  actor_type TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
