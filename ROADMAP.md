# AI Assistant Upgrade Plan

I need you to act as a Senior Full-Stack Architect to upgrade this application from a prototype to a production-ready AI Assistant.

Please analyze the file structure (specifically 'types.ts', 'App.tsx', and 'vite.config.ts') and implement the following phases.

## Phase 1: Security & Authentication (High Priority)
Currently, 'App.tsx' uses a mock login ('localStorage') and 'vite.config.ts' exposes the 'GEMINI_API_KEY' to the client.
1. **Refactor Auth:** Replace the mock login in 'App.tsx' with **Firebase Authentication** (Google Provider).
2. **Secure API:** Move the Gemini API call from the client side to a secure backend function (Firebase Cloud Function or Netlify Function) so the API key is never exposed in the browser.

## Phase 2: Long-Term Memory (The "Memory Bank")
Refer to the 'MemoryItem' interface in 'types.ts'.
1. **Storage:** Create a 'MemoryService' using **IndexedDB** (for local) or **Firestore** (for cloud) to save these items.
2. **Context Injection:** Modify 'gemini.ts' to fetch the last 5 relevant memories and inject them into the system instruction before sending a user prompt.

## Phase 3: Integrations
1. **Calendar:** Using 'CalendarEvent' in 'types.ts', write a service that connects to the **Google Calendar API** to push events created in the 'RelationshipPlanner'.
2. **Telegram:** Create a utility function for 'WritingAssistant' to send generated text to a Telegram Chat ID using the Telegram Bot API.

## Phase 4: Cloud Run Deployment
1. **Docker:** Generate a production-ready 'Dockerfile' (multi-stage: build React with Vite, serve with Nginx).
2. **CI/CD:** Create a 'cloudbuild.yaml' file for the Google Cloud Build pipeline.
