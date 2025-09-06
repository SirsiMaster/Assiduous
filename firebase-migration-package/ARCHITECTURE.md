# Architecture — Sirsi CBV (FERN)

## Components
- **React** (src/*) → Firebase Hosting
- **Express** (functions/index.js) → Firebase Functions (HTTPS)
- **Firestore**: `verifications`, `webhook_logs`, `idempotency`
- **Vendors**: Onfido (KYC), Plaid (funds), optional AML

## Routing
- `/api/**` → Function `app`
- `/*` → React index.html

## Decision policy (MVP)
PASS if:
- KYC == PASSED AND (Funds >= 1.05 × Amount OR Escrowed) AND AML != HIGH
REVIEW otherwise (except KYC FAILED → FAIL)

## Observability
- `webhook_logs` stores raw webhook payloads (audit).
- Function logs in Firebase console; IV&V report in `functions/ivv-report.json`.

## Upgrade path
- JS policy → OPA (Rego)
- Dual vendors (fallback)
- Pub/Sub for eventing
- GCS for receipts + hash anchoring
