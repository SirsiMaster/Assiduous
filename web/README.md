# Web (React/Vite/Tailwind)

This directory contains the modern web frontend for Assiduous Realty.

- Stack: React 18, Vite, TypeScript, TailwindCSS
- Role: Feature-rich AI-aware web UI layered on top of the existing UCS + HTML pages
- Integration:
  - Auth and data provided by Firebase (Auth, Firestore, Functions)
  - Core APIs served by the Go/Chi Cloud Run backend
  - Vertex AI (Gemini) for AI matching, insights, lead assistance, and doc/image intelligence

During the Dec 15, 2025 release push, this app will be progressively embedded into existing `public/` pages and then expanded as the primary UI shell.