# Setup Guide - Unified Lead Platform

> **How to set up the development environment and obtain API keys.**

---

## 1. Prerequisites

- **Node.js v20+ LTS** (v22 installed and tested)
- **npm** (comes with Node.js)
- **Homebrew** (for local PostgreSQL + Redis)
- **VS Code** (recommended, see section 4)

---

## 2. Local Development Services

### PostgreSQL (database)

```bash
brew install postgresql@16
brew services start postgresql@16

# Create the development database
/opt/homebrew/opt/postgresql@16/bin/createdb unified_lead_platform
```

### Redis (job queue)

```bash
brew install redis
brew services start redis

# Verify
redis-cli ping   # → PONG
```

> **Note:** If Redis fails to start with a "redisbloom module failed to load"
> error, comment out the `loadmodule` lines in `/opt/homebrew/etc/redis.conf`
> and restart: `brew services restart redis`.

---

## 3. Environment Variables

```bash
# Copy the example template
cp .env.example .env.local

# Fill in values (see below for where to get API keys)
```

| Variable                   | Where to get it                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`             | Local: `postgresql://<your-macos-username>@localhost:5432/unified_lead_platform?schema=public`<br>Production: Supabase → Project Settings → Database → Connection string |
| `REDIS_URL`                | Local: `redis://localhost:6379`<br>Production: Railway/Render/Upstash Redis instance                                                                                     |
| `APOLLO_API_KEY`           | Section 5                                                                                                                                                                |
| `DEEPSEEK_API_KEY`         | Section 6                                                                                                                                                                |
| `FIRECRAWL_API_KEY`        | Section 7                                                                                                                                                                |
| `MILLION_VERIFIER_API_KEY` | Section 8                                                                                                                                                                |
| `APP_PASSWORD`             | Any strong password (MVP single-user auth)                                                                                                                               |

**Never commit `.env.local`.** It is already in `.gitignore`.

---

## 4. VS Code Setup

Install the recommended extensions (VS Code will prompt automatically):

- **Prisma** (`Prisma.prisma`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

Formatting: run `npm run format` or enable "Format on Save" (see
`.vscode/settings.json`).

---

## 5. Apollo.io API Key

1. Go to https://app.apollo.io
2. Log in (Angela's existing account has credits)
3. Click your avatar (bottom-left) → **Settings**
4. Go to **Integrations** → **API**
5. Generate a new API key (or copy the existing one)
6. Copy to `APOLLO_API_KEY` in `.env.local`

**Costs:** Company search, contact discovery, and email enrichment consume
Apollo credits.

---

## 6. DeepSeek API Key

1. Go to https://platform.deepseek.com
2. Sign up / log in
3. Go to **API Keys** → **Create new API key**
4. Copy to `DEEPSEEK_API_KEY` in `.env.local`
5. Add credit balance (top-up) — validation costs ~$0.005 per company

**Costs:** Used for AI company validation (Stage 4). Very cheap.

---

## 7. Firecrawl API Key

1. Go to https://firecrawl.dev
2. Sign up (free tier available)
3. Go to **Dashboard** → **Settings** → **API Keys**
4. Copy to `FIRECRAWL_API_KEY` in `.env.local`

**Costs:** Website scraping, ~$0.01-0.02 per scrape. 500 scrapes ≈ $5-10.

---

## 8. Million Verifier API Key

1. Go to https://app.millionverifier.com
2. Sign up / log in
3. Go to **Settings** → **API Access**
4. Copy the API key to `MILLION_VERIFIER_API_KEY` in `.env.local`

**Costs:** Email validation credits (~$0.005 per email).

---

## 9. Running the App

```bash
# Install dependencies (if not already)
npm install

# Set up the database (first time only)
npx prisma migrate dev
npx prisma db seed        # optional: loads test data

# Start the Next.js dev server
npm run dev               # → http://localhost:3000

# In a second terminal: start the background worker
npm run worker            # processes queue jobs

# Useful commands
npm run lint              # ESLint
npm run type-check        # TypeScript errors
npm run format            # Prettier formatting
npm run test:queue        # smoke-test the job queue
npm run db:studio         # browse the database
```

---

## 10. Production (Post-MVP)

- **Database:** Supabase — create a project, paste the connection string into
  the `DATABASE_URL` env var on Vercel.
- **Frontend + API:** Vercel — set all env vars in the dashboard.
- **Workers + Redis:** Railway or Render — deploy `src/workers/index.ts`
  (`npm run worker`) with `REDIS_URL` pointing to a hosted Redis.

---

**Last Updated:** 2026-08-02
**Applies To:** Sprint 2 (Environment Setup)
