# Design Decisions & Lessons Learned - Unified Lead Platform

> **Log of all design decisions, why they were made, and lessons learned**
>
> **Purpose:** Ensure future changes consider past reasoning, avoid repeating mistakes

---

## Decision Log Format

Each decision follows this structure:

```
### Decision ID: [Unique identifier]
**Date:** YYYY-MM-DD
**Context:** What problem were we solving?
**Decision:** What did we decide?
**Rationale:** Why did we choose this approach?
**Alternatives Considered:** What else did we consider?
**Consequences:** What are the trade-offs?
**Status:** Active / Superseded / Deprecated
```

---

## Architecture Decisions

### Decision ID: ARCH-001

**Date:** 2026-08-02
**Context:** Need to choose frontend framework for MVP
**Decision:** Use Next.js 14 with App Router
**Rationale:**

- Full-stack framework (frontend + API routes in one codebase)
- Great developer experience
- Built-in optimizations (image optimization, code splitting)
- Easy deployment to Vercel (free tier)
- Strong TypeScript support
  **Alternatives Considered:**
- Separate frontend (React/Vite) + backend (Express): More complex deployment
- Remix: Less mature ecosystem, smaller community
- Pure React SPA: No SSR, slower initial load
  **Consequences:**
- ✅ Faster development (one codebase)
- ✅ Free hosting (Vercel)
- ⚠️ Vendor lock-in to Vercel (but easy to migrate to other platforms later)
  **Status:** Active

---

### Decision ID: ARCH-002

**Date:** 2026-08-02
**Context:** Need database for storing searches, companies, contacts
**Decision:** Use PostgreSQL via Supabase (free tier for MVP)
**Rationale:**

- Relational data model fits domain (clear relationships: searches → companies → contacts)
- JSONB support for flexible data (API responses, scraped content)
- Free tier: 500MB storage (sufficient for 100-200 searches)
- Supabase provides easy setup, no DevOps needed
- Easy upgrade path to Pro plan when needed
  **Alternatives Considered:**
- MongoDB: NoSQL flexibility but harder to model relationships
- MySQL: Similar to PostgreSQL but JSONB support not as good
- SQLite: Too limited for production use
- Firebase: More expensive, less control
  **Consequences:**
- ✅ Proven technology, mature ecosystem
- ✅ Strong typing with Prisma ORM
- ⚠️ Need to monitor database size (500MB limit on free tier)
  **Status:** Active

---

### Decision ID: ARCH-003

**Date:** 2026-08-02
**Context:** Long-running searches (45-60 min) can't run in API routes (30s timeout)
**Decision:** Use background workers with BullMQ + Redis for job processing
**Rationale:**

- Searches must run asynchronously (too long for HTTP request)
- BullMQ provides:
  - Job queue management
  - Retry logic
  - Progress tracking
  - Delayed jobs (for rate limiting)
- Redis required for BullMQ, can also use for caching later
  **Alternatives Considered:**
- Vercel Serverless Functions: 30s timeout (too short)
- AWS Lambda: 15 min timeout (still too short for some searches)
- Long-polling: Inefficient, keeps connection open
  **Consequences:**
- ✅ Searches can run for hours if needed
- ✅ Built-in retry and failure handling
- ⚠️ Additional infrastructure required (Redis + worker processes)
- ⚠️ Need separate hosting for workers (Railway/Render)
  **Status:** Active

---

### Decision ID: ARCH-004

**Date:** 2026-08-02
**Context:** Need ORM for type-safe database access
**Decision:** Use Prisma ORM
**Rationale:**

- TypeScript-first: Auto-generated types from schema
- Great DX: Migrations handled automatically
- Type-safe queries (catch errors at compile-time)
- Excellent VS Code integration
  **Alternatives Considered:**
- Drizzle ORM: Newer, less mature
- TypeORM: More complex, less type-safe
- Raw SQL: No type safety, error-prone
  **Consequences:**
- ✅ Catch database errors before runtime
- ✅ Fast development with autocomplete
- ⚠️ Migrations need careful management in production
  **Status:** Active

---

## Workflow Decisions

### Decision ID: WORKFLOW-001

**Date:** 2026-08-02
**Context:** Need to decide when to validate companies (before or after email enrichment)
**Decision:** Validate companies BEFORE email enrichment (Phase 2 before Phase 3)
**Rationale:**

- Huge cost savings: Don't spend credits enriching bad-fit companies
- If 40% of companies are rejected, save 40% on email enrichment costs
- Better user experience: Only deliver relevant leads
  **Alternatives Considered:**
- Validate after enrichment: Simpler workflow but wastes credits on bad fits
- Skip validation entirely: Cheapest upfront but delivers poor-quality leads
  **Consequences:**
- ✅ 30-40% cost reduction per search
- ✅ Higher lead quality
- ⚠️ Adds 20-25 minutes to search time (scraping + AI validation)
  **Status:** Active
  **Lesson Learned:** Always optimize for quality and long-term cost, not short-term speed

---

### Decision ID: WORKFLOW-002

**Date:** 2026-08-02
**Context:** How to handle crashes mid-search (power outage, worker crash, etc.)
**Decision:** Implement checkpoint saving every 50 records
**Rationale:**

- Searches take 45-60 minutes, too long to lose all progress on crash
- Saving every 50 records is granular enough (lose max 50 records worth of work)
- Idempotent operations: Safe to retry without duplicate API calls
  **Alternatives Considered:**
- Save only at end: Lose all progress on crash (unacceptable)
- Save every record: Too many database writes, performance impact
- Save at phase boundaries: Still lose too much progress (whole phase)
  **Consequences:**
- ✅ Crash recovery without data loss
- ✅ Resume from checkpoint, no duplicate API calls
- ⚠️ Slightly more complex code (checkpoint logic)
  **Status:** Active
  **Lesson Learned:** For long-running processes, frequent checkpoints are essential

---

### Decision ID: WORKFLOW-003

**Date:** 2026-08-02
**Context:** Should we show estimated cost before starting search?
**Decision:** YES - Always show cost estimate and require user approval (Stage 2)
**Rationale:**

- Transparency builds trust
- Prevents sticker shock ("I didn't know it would cost $25!")
- Gives user control (cancel if too expensive)
- Aligns with "no surprises" principle
  **Alternatives Considered:**
- No cost estimate: Simpler UX but users can't budget
- Show cost after: Too late, credits already spent
  **Consequences:**
- ✅ User always knows what they're paying
- ✅ Can cancel before spending
- ⚠️ One extra step in workflow (approval screen)
  **Status:** Active
  **Lesson Learned:** Transparency over simplicity for cost-sensitive operations

---

## Integration Decisions

### Decision ID: INTEGRATION-001

**Date:** 2026-08-02
**Context:** Which email enrichment source to use first
**Decision:** Use Apollo as primary source for MVP, add Prospeo/Expandi in post-MVP
**Rationale:**

- Angela already has Apollo subscription
- Apollo has best success rate in testing (~70% email discovery)
- Adding multiple sources adds complexity
- Can always add fallback sources later
  **Alternatives Considered:**
- Use all sources from day 1: Overcomplicated for MVP
- Use Prospeo first: Lower success rate than Apollo
  **Consequences:**
- ✅ Simpler MVP implementation
- ✅ Leverage existing subscription
- ⚠️ Lower total email discovery rate (no fallback) - acceptable for MVP
  **Status:** Active (will add multi-source in v1.1.0)
  **Lesson Learned:** Start simple, add complexity when proven necessary

---

### Decision ID: INTEGRATION-002

**Date:** 2026-08-02
**Context:** Which AI model to use for company validation
**Decision:** Use DeepSeek instead of Claude/GPT-4
**Rationale:**

- Cost: DeepSeek ~$0.005 per validation, Claude/GPT-4 ~$0.03-0.05 (6-10x more expensive)
- Quality: DeepSeek sufficient for structured validation tasks
- Volume: 500 companies × $0.005 = $2.50 vs 500 × $0.03 = $15
  **Alternatives Considered:**
- Claude Sonnet: Higher quality but 6x more expensive
- GPT-4: Highest quality but 10x more expensive
- Open-source model (self-hosted): Cheapest but requires infrastructure
  **Consequences:**
- ✅ Massive cost savings (6-10x cheaper)
- ⚠️ Slightly lower quality (but good enough for MVP)
- ✅ Can always upgrade to Claude/GPT-4 for premium tier users later
  **Status:** Active
  **Lesson Learned:** Choose the cheapest tool that meets quality bar, not the best tool

---

## UI/UX Decisions

### Decision ID: UX-001

**Date:** 2026-08-02
**Context:** How to show search progress to user
**Decision:** Real-time progress tracking with phase names and percentages
**Rationale:**

- 45-60 minute wait feels long without feedback
- Showing progress keeps user engaged
- Phase names explain what's happening ("Validating companies...")
- Percentage gives sense of completion
  **Alternatives Considered:**
- Just show spinner: Too vague, user doesn't know what's happening
- Email when done: User has to leave and come back
- Polling every 5 minutes: Not real-time enough
  **Consequences:**
- ✅ Better user experience
- ✅ User understands what's happening
- ⚠️ Requires polling or WebSockets (adds complexity)
  **Status:** Active
  **Lesson Learned:** For long processes, progress feedback is essential

---

### Decision ID: UX-002

**Date:** 2026-08-02
**Context:** How should user input their ICP criteria
**Decision:** Use natural language prompt (textarea) instead of structured form
**Rationale:**

- ICP criteria vary widely by user
- Structured form would need dozens of fields
- Natural language is flexible ("must have", "preferably", "not")
- DeepSeek can interpret natural language well
  **Alternatives Considered:**
- Structured form with many fields: Too rigid, can't capture nuances
- Both structured + natural language: Redundant, confusing
  **Consequences:**
- ✅ Flexible, works for any ICP
- ✅ Faster user input
- ⚠️ AI interpretation could miss nuances (acceptable trade-off)
  **Status:** Active
  **Lesson Learned:** Natural language inputs work well when backed by good AI

---

## Security Decisions

### Decision ID: SECURITY-001

**Date:** 2026-08-02
**Context:** How to store API keys
**Decision:** Use environment variables (.env.local) never committed to git
**Rationale:**

- API keys are sensitive credentials
- Committing to git = security breach
- Environment variables are standard practice
- Vercel supports env vars in dashboard
  **Alternatives Considered:**
- Hardcode in code: NEVER (security nightmare)
- External secrets manager (AWS Secrets Manager): Overkill for MVP
  **Consequences:**
- ✅ Keys never exposed in git
- ✅ Different keys for dev/staging/prod
- ⚠️ Need to document setup for other developers
  **Status:** Active
  **Lesson Learned:** Security is non-negotiable, use env vars from day 1

---

### Decision ID: SECURITY-002

**Date:** 2026-08-02
**Context:** Authentication for MVP (single user: Angela)
**Decision:** Simple password protection, no full auth system
**Rationale:**

- Only 1 user (Angela) for MVP
- Full auth (Supabase Auth, OAuth) is overkill
- Single shared password stored in env var is sufficient
- Can add proper auth when scaling to multiple users
  **Alternatives Considered:**
- Full auth system: Too complex for MVP
- No auth: Insecure if accidentally deployed publicly
- API keys: Awkward UX for web app
  **Consequences:**
- ✅ Simple, fast implementation
- ✅ Good enough for MVP
- ⚠️ Must implement proper auth before adding 2nd user
  **Status:** Active (temporary, will supersede in v2.0.0)
  **Lesson Learned:** Don't over-engineer for future users, solve for current user

---

## Cost Optimization Decisions

### Decision ID: COST-001

**Date:** 2026-08-02
**Context:** Should we cache scraped website data?
**Decision:** YES for post-MVP, NO for MVP
**Rationale:**

- Caching saves credits on repeat searches of same companies
- MVP: Simpler without caching, acceptable to re-scrape
- Post-MVP: Add caching when cost becomes noticeable
  **Alternatives Considered:**
- Cache from day 1: Adds complexity (cache invalidation, storage)
- Never cache: Wastes credits on repeat searches
  **Consequences:**
- ✅ Simpler MVP
- ⚠️ Higher costs per search (but acceptable for low volume)
- 📋 Add caching in v1.2.0 when needed
  **Status:** Deferred to post-MVP
  **Lesson Learned:** Optimize when you have data, not prematurely

---

## Development Decisions

### Decision ID: DEV-001

**Date:** 2026-08-02
**Context:** Handoff.md Step 2 suggested `create-next-app --no-src-dir`, but the documented project structure (HANDOFF.md and ARCHITECTURE.md) shows `/src/app`, `/src/components`, `/src/integrations`.
**Decision:** Use the `/src` directory structure (src-dir) and pin Next.js to v14.2.35 exactly as the architecture specifies.
**Rationale:** The documented structure is unambiguous about `/src`. Pinning v14 avoids drift from the documented stack (Next.js 14 App Router) and keeps every example in WORKFLOW.md/DEVELOPMENT-WORKFLOW.md valid.
**Alternatives Considered:** Latest create-next-app (Next 15/16) - would invalidate documented API examples; no-src-dir - contradicts documented structure.
**Consequences:** ✅ All documentation examples remain valid; ✅ No surprises for Sonnet review; ⚠️ Framework pinned to 14.x (upgradeable later, backward-compatible route structure).
**Status:** Active

---

### Decision ID: DEV-002

**Date:** 2026-08-02
**Context:** `npm install prisma` installed Prisma 7, which uses a new `prisma.config.ts` workflow (no env URL in schema, no package.json seed config) that contradicts DEVELOPMENT-WORKFLOW.md examples.
**Decision:** Pin Prisma to v6.19.3 (latest 6.x) and use the classic `prisma-client-js` generator.
**Rationale:** Prisma 6 matches every documented example: `url = env("DATABASE_URL")` in schema, `"prisma": { "seed": ... }` in package.json, `prisma migrate dev` workflow.
**Alternatives Considered:** Prisma 7 with prisma.config.ts - newer but deviates from documentation and would confuse future reviews.
**Consequences:** ✅ Docs remain accurate; ✅ Stable, well-documented ORM; ⚠️ Will need upgrade consideration before production.
**Status:** Active

---

### Decision ID: DEV-003

**Date:** 2026-08-02
**Context:** TODO.md Sprint 2 requires PostgreSQL and Redis locally, but Docker is not installed. Supabase signup is blocked (needs Angela's account).
**Decision:** Install PostgreSQL 16 + Redis via Homebrew for local development; keep Supabase for production deployment (Sprint 14).
**Rationale:** Homebrew services are native, free, and reliable on macOS. Nothing about the schema or code is Supabase-specific, so swapping DATABASE_URL later is a config change only.
**Alternatives Considered:** Docker (not installed); SQLite (deviates from PostgreSQL stack).
**Consequences:** ✅ Full local dev experience (migrations, seed, queue tested); ✅ Zero-cost; ⚠️ Angela must sign up for Supabase before production deployment.
**Status:** Active

---

### Decision ID: DEV-004

**Date:** 2026-08-02
**Context:** The latest Shadcn CLI (v5) only supports Tailwind v4 and requires a different init flow. The documented stack uses Next.js 14 + Tailwind v3.4.
**Decision:** Pin Shadcn CLI to v2.3.0 for project initialization and component additions.
**Rationale:** Shadcn 2.3.0 fully supports Tailwind v3 projects (generates components.json, CSS variables, tailwind.config updates) and matches the era of the documented stack.
**Alternatives Considered:** Shadcn v3/v4/v5 (Tailwind v4-only); manual component copy.
**Consequences:** ✅ Components are standard shadcn registry components (same source of truth, ui.shadcn.com); ✅ No lock-in - can upgrade when the project migrates to Tailwind v4; ⚠️ Older CLI (component set lacks the newest 2026 additions like combobox - will build custom multi-select instead).
**Status:** Active

---

### Decision ID: DEV-005

**Date:** 2026-08-02
**Context:** Homebrew Redis failed to start: default config tries to load `redisbloom`/`redisearch`/`redisjson`/`redistimeseries` modules that are not shipped with the formula.
**Decision:** Commented out the four `loadmodule` lines in `/opt/homebrew/etc/redis.conf` and restarted Redis via `brew services`.
**Rationale:** The MVP only needs core Redis (BullMQ queues). Stack modules are optional Redis extensions not used anywhere in the architecture.
**Consequences:** ✅ Redis runs reliably as a background service; ⚠️ Machine-local config change (documented in docs/SETUP.md so it can be re-applied elsewhere).
**Status:** Active

---

### Decision ID: DEV-006
**Date:** 2026-08-02
**Context:** Angela wants to see the product working, but the 4 MVP API keys (Apollo, DeepSeek, Firecrawl, Million Verifier) are not available yet.
**Decision:** Implement a Demo Mode (DEMO_MODE=true env var) where every integration client returns simulated, deterministic data with small artificial delays.
**Rationale:** Lets the full pipeline (discovery → validation → contacts → enrichment → verification) be exercised end-to-end with zero cost and no keys, so the product can be demonstrated immediately. Demo mode never touches real APIs or real money.
**Alternatives Considered:** Block on API keys (slows demo); hardcode fake data in UI only (doesn't test the pipeline); mock framework (extra dependency).
**Consequences:** ✅ Product fully demonstrable today; ✅ Same code path as production (demo providers swap inside each client); ⚠️ Demo numbers are simulated - real quality metrics require real keys; ⚠️ Must flip DEMO_MODE=false when real keys are configured.
**Status:** Active (temporary development aid; flip off at deployment)
**Lesson Learned:** A demo-data layer inside the integration clients is a cheap way to keep the whole system testable without credentials.

---

### Decision ID: DEV-007
**Date:** 2026-08-02
**Context:** Next.js loads `.env.local`, but the standalone worker process (tsx) and CLI scripts only loaded `.env` via `dotenv/config`.
**Decision:** Worker and scripts now load `.env.local` first, then fall back to `.env` (dotenv does not override existing values, so `.env.local` wins).
**Rationale:** One source of truth for local configuration (`.env.local`), matching Next.js behavior; production workers get env vars from the platform (no files), so nothing changes there.
**Consequences:** ✅ No duplicated env files to keep in sync; ✅ Prisma CLI continues to use `.env` as before.
**Status:** Active

---

### Decision ID: DEV-008
**Date:** 2026-08-02
**Context:** Pipeline progress percentages are defined per phase in WORKFLOW.md (discovery 15%, validation 45%, contacts 65%, enrichment 85%, validation 100%).
**Decision:** Central phase metadata (labels, descriptions, cumulative percent ranges) lives in src/lib/constants.ts PHASES; workers compute per-item progress within each phase's range.
**Rationale:** Single source of truth for phase labels and progress mapping shared by workers, progress UI, and pipeline helpers; avoids drift between stages.
**Consequences:** ✅ Consistent progress display everywhere; ✅ Adding a phase later = one file.
**Status:** Active

---

## Lessons Learned (To Be Added During Development)

### Lesson Template

```
### Lesson ID: LESSON-XXX
**Date:** YYYY-MM-DD
**Context:** What happened?
**What We Learned:** Key takeaway
**What We'll Do Differently:** Changes we'll make
**Related Decisions:** Which decisions does this inform?
```

---

## Decision Review Schedule

**Every 3 months, review decisions and ask:**

1. Is this decision still valid?
2. Have circumstances changed?
3. Should we supersede this decision?

**Next Review:** 2026-11-02

---

**Last Updated:** 2026-08-02
**Total Decisions:** 20
**Active:** 19
**Deferred:** 1
**Superseded:** 0
