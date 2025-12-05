# Backend (Go 1.21 + Chi + Cloud Run)

This directory contains Go services that power the Assiduous Realty data and API layer.

- Stack: Go 1.21, Chi router, Cloud Run
- Responsibilities:
  - Core REST APIs for properties, leads, offers, analytics, billing, and integrations
  - MLS and FSBO ingestion services
  - Fintech and ops integrations (Plaid, Lob, OpenSign)
  - KMS-backed encryption helpers for zero-knowledge data patterns

These services are deployed to Cloud Run and consumed by both the existing HTML/UCS frontends and the new React web application.