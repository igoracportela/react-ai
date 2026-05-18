# AI Scribe Notes Management Tool

NestJS + Next.js + PostgreSQL implementation of the AI Scribe assessment brief. A focused vertical slice: create and view AI-generated clinical notes per patient, with explicit processing status and PHI-aware documentation.

## Quick start (≤ 5 commands)

```bash
cd test-project
docker compose up --build
```

Open **http://localhost:3000** (UI) and **http://localhost:3001/api** (API).

No `.env` file is required — defaults use AI mock mode (no API key). Optional: `cp .env.example .env` to customize.

After a schema change, reset the database volume once:

```bash
docker compose down -v && docker compose up --build
```

### What `docker compose up` does automatically

| Step | Mechanism |
|------|-----------|
| PostgreSQL | `postgres` service + `postgres_data` volume (data survives restart) |
| Migrations | TypeORM `migrationsRun` on API boot (`src/database/migrations/`) |
| Seed patients | `SeedService` inserts 3 patients if table is empty |
| API + UI | `backend` and `frontend` containers |

## Automated tests

```bash
cd backend
npm install
npm test                    # unit tests (no running server)
```

Against a live stack:

```bash
docker compose up -d
cd backend && npm install
E2E_BASE_URL=http://localhost:3001/api npm run test:e2e
```

## Environment variables

See [`.env.example`](.env.example). **Never commit `.env`** — it is gitignored. No API keys are hardcoded in source.

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME` | No (defaults in compose) | PostgreSQL credentials |
| `DATABASE_URL` | No | Alternative connection string |
| `OPENAI_API_KEY` | No (mock mode default) | Whisper + GPT when `AI_MOCK_MODE=false` |
| `AI_MOCK_MODE` | No (`true` in compose) | Deterministic AI without external calls |
| `NEXT_PUBLIC_API_URL` | No | Browser → API |
| `API_INTERNAL_URL` | No | Next.js server → API in Docker (`http://backend:3001/api`) |
| `UPLOAD_DIR`, `CORS_ORIGIN`, `PORT` | No | Runtime paths / CORS / API port |

## Data model

**Patients** (`patients`) — identity/demographics only: `external_id`, `name`, `date_of_birth`, `gender`, `address`, `phone_number`, timestamps.

**Notes** (`notes`) — clinical documentation lifecycle, FK to `patients`:

| Column | Purpose |
|--------|---------|
| `raw_transcription` | Verbatim typed input or audio transcription (saved before SOAP structuring for audio) |
| `processed_note` | AI-structured SOAP text (separate from raw) |
| `status` | `pending` → `processing` → `done` \| `error` |
| `error_code`, `error_message` | User-facing failure details |
| `created_at`, `updated_at` | Audit timestamps |

Migrations: `backend/src/database/migrations/` (versioned TypeORM; **not** ad-hoc `init.sql`).

## API

Base: `http://localhost:3001/api`

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/patients` | List seeded patients |
| `GET` | `/patients/:id` | Patient demographics |
| `GET` | `/notes` | List notes (`patientName`, `createdAt`, `preview`, `status`) |
| `GET` | `/notes/:id` | Note + nested `patient` |
| `POST` | `/notes` | Create from JSON `{ patientId, text }` or multipart audio |

## Security & compliance (auth not implemented)

**Authentication is not implemented** — out of scope for this MVP. In production, names, DOB, notes, and audio are **PHI under HIPAA** (and LGPD where applicable). I would add OAuth2/JWT, RBAC, tenant scoping, audit logs on PHI access, TLS, encryption at rest, and a BAA with any external AI vendor — or self-hosted transcription to limit egress.

## Trade-offs (what we cut and why)

| Decision | MVP choice | Why cut / defer | Production |
|----------|------------|-----------------|------------|
| **Processing model** | Synchronous HTTP; status column updated inline (`pending`→`processing`→`done`/`error`) | Simplest path for reviewers; status still persisted for audit | `202` + SQS worker; client polls `GET /notes/:id` or SNS/WebSocket |
| **Polling / WebSockets** | None during submit; user waits on form | Avoids channel auth and infra for a demo | Poll while `processing`, or push via SNS |
| **Auth** | None | Assessment scope | JWT + RBAC + audit trail (see Security) |
| **Migrations** | TypeORM versioned migrations, auto-run on boot | Mature schema without manual SQL | CI migration job; never `synchronize` in prod |
| **Audio storage** | Local disk (`uploads/` volume) | Zero cloud setup | S3 pre-signed uploads + lifecycle |
| **AI vendor** | OpenAI Whisper + chat (or mock) | Fastest accurate path | Abstract `AiService`; optional self-hosted Whisper |
| **Tests** | Unit + optional HTTP e2e vs live stack | No test DB in default `npm test` | Testcontainers Postgres in CI |

**Transcription status example:** I did not add WebSockets because the MVP blocks on one request but still writes `status` on the row. In production, long audio would enqueue on **SQS**, persist `raw_transcription` after Whisper, then `processed_note` after structuring, and notify the UI via poll or **SNS → WebSocket**.

## Rubric checklist

| Criterion | Status |
|-----------|--------|
| `docker compose up` only (≤5 commands in README) | ✅ |
| `.env.example` complete; no secrets in git | ✅ |
| Trade-offs with justification | ✅ |
| Postgres + migrations + seed on compose up | ✅ |
| `raw_transcription` + `processed_note` columns | ✅ |
| Note `status` enum | ✅ |
| 3 seeded patients (auto) | ✅ |
| Modular NestJS (controllers/services/entities) | ✅ |
| `strict` TypeScript | ✅ |
| Global error filter + note-level errors | ✅ |
| `class-validator` on DTOs | ✅ |
| Audio/text E2E flow + SOAP | ✅ (mock or OpenAI) |
| List: patient name, date, preview | ✅ |
| Detail: raw + processed + patient panel | ✅ |
| Data persists (`postgres_data` volume) | ✅ |
| Automated tests | ✅ `npm test` + optional `test:e2e` |

## Local development (without Docker)

```bash
# Postgres
docker run -d --name ai-scribe-pg \
  -e POSTGRES_USER=scribe_user -e POSTGRES_PASSWORD=scribe_pass \
  -e POSTGRES_DB=ai_scribe_db -p 5433:5432 postgres:15-alpine

cd backend && cp ../.env.example .env && npm install && npm run start:dev
cd frontend && npm install && NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run dev
```

## Architecture

```
test-project/
├── backend/     NestJS — patients, notes, ai modules; TypeORM migrations
├── frontend/    Next.js App Router
├── docker-compose.yml
└── README.md
```
