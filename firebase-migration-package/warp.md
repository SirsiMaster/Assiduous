# Warp Quickstart — Sirsi CBV on Firebase

## TL;DR
- Source of truth: **GitHub repo**
- Runtime: **Firebase Hosting + Cloud Functions + Firestore**
- One-liners:
  - `./scripts/init-firebase.sh`
  - `./scripts/migrate.sh`
  - `./scripts/deploy.sh`
  - `./scripts/qa-check.sh`

## What lives where
- **GitHub**: all source (React, Functions), docs, CI/CD.
- **Firebase**: built React app (Hosting), Express API/webhooks (Functions), data (Firestore), optional blobs (GCS).

## Local dev
- `firebase emulators:start` to run Hosting + Functions + Firestore locally.
- Frontend served at http://localhost:5000
- API at http://localhost:5001/YOUR_FIREBASE_PROJECT_ID/us-central1/app

## Security
- Webhooks HMAC-verified.
- Firestore Rules lock client writes on `/verifications`.
- Secrets via `firebase functions:config:set` (see scripts).
