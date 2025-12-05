#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME=${SERVICE_NAME:-assiduous-api}
PROJECT_ID=${GCP_PROJECT_ID:-assiduous-prod}
REGION=${GCP_REGION:-us-central1}

IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "[deploy_api] Building image ${IMAGE}..."
cd "$(dirname "$0")/.." # repo root

docker build -t "${IMAGE}" ./backend/cmd/api

echo "[deploy_api] Pushing image..."
docker push "${IMAGE}"

echo "[deploy_api] Deploying to Cloud Run (service=${SERVICE_NAME}, project=${PROJECT_ID}, region=${REGION})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --project "${PROJECT_ID}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080

echo "[deploy_api] Done."
