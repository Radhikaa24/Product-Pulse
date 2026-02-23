# Product Pulse API

Backend API for Product Pulse — a daily product intelligence platform for product managers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW                                 │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Sources     │     │  Ingestion   │     │  PostgreSQL  │    │
│  │              │────▶│  Service     │────▶│  (DRAFT)     │    │
│  │ Product Hunt │     │              │     │              │    │
│  │ RSS Feeds    │     │ POST /admin/ │     │  stories     │    │
│  │ Newsletters  │     │   ingest     │     │  table       │    │
│  └──────────────┘     └──────────────┘     └──────┬───────┘    │
│                                                    │            │
│                                                    ▼            │
│                       ┌──────────────┐     ┌──────────────┐    │
│                       │  Processing  │     │  PostgreSQL  │    │
│                       │  Service     │────▶│  (REVIEW)    │    │
│                       │              │     │              │    │
│                       │ AI generates │     │ + summary    │    │
│                       │ summary +    │     │ + breakdown  │    │
│                       │ breakdown +  │     │ + challenge   │    │
│                       │ challenge    │     │              │    │
│                       │              │     │              │    │
│                       │ POST /admin/ │     └──────┬───────┘    │
│                       │  process/:id │            │            │
│                       └──────────────┘            │            │
│                                                    ▼            │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   Frontend   │     │  Edition     │     │  PostgreSQL  │    │
│  │              │◀────│  Service     │◀────│  (PUBLISHED) │    │
│  │ Next.js SPA  │     │              │     │              │    │
│  │              │     │ GET /api/    │     │ Editorial    │    │
│  │ Fetches from │     │  edition/    │     │ approves,    │    │
│  │ API on load  │     │  today       │     │ then publish │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Lifecycle

| Stage | Status | What happens | Who triggers it |
|-------|--------|-------------|-----------------|
| 1. Ingest | `DRAFT` | Raw content pulled from source, stored in DB | Cron job or `POST /admin/ingest` |
| 2. Process | `PROCESSING` → `REVIEW` | AI generates summary, breakdown, challenge | Cron job or `POST /admin/process/:id` |
| 3. Assemble | `REVIEW` | Stories + challenge assigned to a date | Editor via `POST /admin/edition/assemble` |
| 4. Publish | `PUBLISHED` | Content goes live, served to users | Editor via `POST /admin/edition/publish` |
| 5. Archive | `ARCHIVED` | Past editions remain accessible | Automatic after edition date passes |

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL and API keys

# 3. Create database tables
npx prisma migrate dev --name init

# 4. Start the server
npm run dev
```

## API Endpoints

### User-Facing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/edition/today?limit=2&cursor=` | Optional | Today's edition (stories + challenge) |
| `GET` | `/api/stories/:id` | Optional | Single story with full breakdown |
| `POST` | `/api/stories/:id/read` | Required | Mark story as read |
| `POST` | `/api/challenges/:id/submit` | Required | Submit challenge answer |
| `GET` | `/api/dashboard` | Required | User progress & skill breakdown |
| `GET` | `/api/archive?page=1` | None | Browse past editions |

### Admin / Content Pipeline

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/ingest` | Pull content from a source |
| `POST` | `/api/admin/process/:storyId` | AI-process a single story |
| `POST` | `/api/admin/process-all` | Process all DRAFT stories |
| `POST` | `/api/admin/edition/assemble` | Assign stories to a date |
| `POST` | `/api/admin/edition/publish` | Publish an edition |

## Project Structure

```
product-pulse-api/
├── prisma/
│   └── schema.prisma          # Database schema (all models)
├── src/
│   ├── config/
│   │   ├── database.js        # Prisma client singleton
│   │   └── env.js             # Environment config + validation
│   ├── middleware/
│   │   └── auth.js            # JWT auth (required + optional)
│   ├── routes/
│   │   └── api.routes.js      # All REST endpoints
│   ├── services/
│   │   ├── ingestion.service.js   # Source adapters + raw content ingestion
│   │   ├── processing.service.js  # AI summary/breakdown/challenge generation
│   │   ├── edition.service.js     # Edition assembly, publishing, delivery
│   │   └── progress.service.js    # Reads, submissions, streaks, dashboard
│   └── server.js              # Express app entry point
├── .env.example
├── package.json
└── README.md
```
