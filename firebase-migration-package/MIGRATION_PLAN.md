# Migration Plan — GitHub Pages → Firebase

## Goals
- Zero/minimal downtime
- Keep GitHub as repo of record
- Single domain for frontend+API

## Phases
1) **Prep**
- Install Firebase CLI: `npm i -g firebase-tools`
- `firebase login`
- Ensure `gcloud` installed (optional)
- Decide project id (e.g., YOUR_FIREBASE_PROJECT_ID)

2) **Bootstrap**
- `./scripts/init-firebase.sh` (creates/links project, enables services, sets secrets)

3) **Dry Run (emulators)**
- `firebase emulators:start`
- Hit local endpoints, run webhook test payloads

4) **Preview Deploy**
- `firebase hosting:channel:deploy pr-0`
- Configure vendor webhooks to preview URL for sandbox test

5) **Production Deploy**
- `./scripts/deploy.sh`
- Optional: add custom domain in Firebase console (CNAME cutover)

6) **IV&V**
- `./scripts/qa-check.sh`
- Review `functions/ivv-report.json` and `functions/ivv-report.md`

7) **Rollback**
- Redeploy previous Hosting version (`firebase deploy --only hosting` with prior release)
- DNS flip back to GitHub Pages (if used)
