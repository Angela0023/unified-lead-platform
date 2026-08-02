# TODO - Unified Lead Platform

> **Task tracking for MVP development**
>
> **Status Legend:**
>
> - ⏳ Not Started
> - 🔄 In Progress
> - ✅ Completed
> - ⏸️ Blocked
> - ❌ Canceled

---

## Current Sprint: Planning & Documentation

### Documentation ✅

- [x] Create README.md ✅ 2026-08-02
- [x] Create PLANNING.md ✅ 2026-08-02
- [x] Create ARCHITECTURE.md ✅ 2026-08-02
- [x] Create WORKFLOW.md ✅ 2026-08-02
- [x] Create BOTTLENECKS.md ✅ 2026-08-02
- [x] Create BEST-SCENARIO.md ✅ 2026-08-02
- [x] Create QUALITY-GATES.md ✅ 2026-08-02
- [x] Create DEVELOPMENT-WORKFLOW.md ✅ 2026-08-02
- [x] Create CHANGELOG.md ✅ 2026-08-02
- [x] Create DECISIONS.md ✅ 2026-08-02
- [x] Create TODO.md ✅ 2026-08-02
- [x] Create .gitignore ✅ 2026-08-02
- [x] Push to GitHub (Angela0023) ✅ 2026-08-02
- [x] Get Angela's approval on plan ✅ 2026-08-02 (approved - development started)

---

## Current Sprint: Environment Setup ✅

### Repository Setup ✅

- [x] Initialize git repository ✅ 2026-08-02
- [x] Create remote on GitHub (Angela0023/unified-lead-platform) ✅ 2026-08-02
- [x] Push initial documentation ✅ 2026-08-02
- [ ] Set up branch protection rules ⏳ (attempted via gh CLI, needs GitHub admin confirmation)

### Development Environment ✅

- [x] Install Node.js (v20 LTS) ✅ 2026-08-02 (DeepSeek) - v22.13.1 LTS installed (20/22 both LTS)
- [x] Install pnpm or npm ✅ 2026-08-02 (DeepSeek) - npm 10.9.2
- [x] Set up VS Code with recommended extensions ✅ 2026-08-02 (DeepSeek) - .vscode/extensions.json created
  - [x] Prisma
  - [x] Tailwind CSS IntelliSense
  - [x] ESLint
  - [x] Prettier

### Project Initialization ✅

- [x] Initialize Next.js project (npx create-next-app@latest) ✅ 2026-08-02 (DeepSeek) - Next.js 14.2.35, App Router, /src directory
- [x] Configure TypeScript ✅ 2026-08-02 (DeepSeek)
- [x] Set up Tailwind CSS ✅ 2026-08-02 (DeepSeek) - v3.4
- [x] Install Shadcn UI ✅ 2026-08-02 (DeepSeek) - 15 components (button, input, textarea, label, select, card, badge, tooltip, progress, separator, alert, sonner, table, checkbox, skeleton)
- [x] Set up ESLint + Prettier ✅ 2026-08-02 (DeepSeek) - lint + type-check + format scripts
- [x] Create .env.example file ✅ 2026-08-02 (DeepSeek)

### Database Setup ⚠️ (local done, Supabase pending)

- [ ] Sign up for Supabase ⏸️ BLOCKED - needs Angela's account (local PostgreSQL used for dev)
- [ ] Create database instance ⏸️ BLOCKED - local instance created via Homebrew instead
- [x] Install Prisma ✅ 2026-08-02 (DeepSeek) - pinned v6.19.3 (matches documented workflow)
- [x] Create Prisma schema (schema.prisma) ✅ 2026-08-02 (DeepSeek) - from ARCHITECTURE.md + FK indexes
- [x] Run initial migration ✅ 2026-08-02 (DeepSeek) - applied to local PostgreSQL 16
- [x] Seed database with test data ✅ 2026-08-02 (DeepSeek) - 1 search, 5 companies, 5 contacts, 2 jobs

### API Key Setup ⚠️ (documented, untested)

- [x] Document how to get Apollo API key ✅ 2026-08-02 (DeepSeek) - docs/SETUP.md
- [x] Document how to get DeepSeek API key ✅ 2026-08-02 (DeepSeek) - docs/SETUP.md
- [x] Document how to get Firecrawl API key ✅ 2026-08-02 (DeepSeek) - docs/SETUP.md
- [x] Document how to get Million Verifier API key ✅ 2026-08-02 (DeepSeek) - docs/SETUP.md
- [ ] Test all API connections ⏸️ BLOCKED - needs API keys from Angela

### Background Workers Setup ✅

- [x] Set up Redis locally (Docker or native) ✅ 2026-08-02 (DeepSeek) - Homebrew Redis running (fixed redisbloom module config issue)
- [x] Install BullMQ ✅ 2026-08-02 (DeepSeek) - v6.0.5 + ioredis
- [x] Create worker process file ✅ 2026-08-02 (DeepSeek) - src/workers/index.ts (npm run worker)
- [x] Test job queue locally ✅ 2026-08-02 (DeepSeek) - test job enqueued + processed by worker (verified in Redis)

---

## Sprint 3: Stage 0 - Search Form UI

### Search Form ⏳

- [ ] Create /search page ⏳
- [ ] Industry selector (multi-select dropdown) ⏳
- [ ] Company size selector (dropdown) ⏳
- [ ] Location selector (multi-select) ⏳
- [ ] Target role input (text) ⏳
- [ ] ICP prompt textarea ⏳
- [ ] Form validation ⏳
- [ ] Example ICP prompts (pre-fill options) ⏳

### UI Polish ⏳

- [ ] Responsive design (mobile + desktop) ⏳
- [ ] Loading states ⏳
- [ ] Error states ⏳
- [ ] Success states ⏳
- [ ] Tooltips for help text ⏳

---

## Sprint 4: Stage 1 - Pre-flight Checks

### API Health Check Functions ⏳

- [ ] Create apolloClient.testConnection() ⏳
- [ ] Create deepseekClient.testConnection() ⏳
- [ ] Create firecrawlClient.testConnection() ⏳
- [ ] Create mvClient.testConnection() ⏳

### Credit Balance Check Functions ⏳

- [ ] Create apolloClient.getCreditsRemaining() ⏳
- [ ] Create firecrawlClient.getCreditsRemaining() ⏳
- [ ] Create mvClient.getCreditsRemaining() ⏳

### Infrastructure Health Checks ⏳

- [ ] Database connection test ⏳
- [ ] Redis connection test ⏳
- [ ] Worker process check ⏳

### Pre-flight UI ⏳

- [ ] Health check results page ⏳
- [ ] Error handling for failed checks ⏳
- [ ] "All systems go" confirmation ⏳

---

## Sprint 5: Stage 2 - Cost Estimation

### Estimation Logic ⏳

- [ ] Apollo volume estimation API call ⏳
- [ ] Calculate cost per phase ⏳
- [ ] Calculate total cost ⏳
- [ ] Calculate time per phase ⏳
- [ ] Calculate total time ⏳

### Approval UI ⏳

- [ ] Cost breakdown table ⏳
- [ ] Time breakdown ⏳
- [ ] Credit usage summary ⏳
- [ ] Cancel button ⏳
- [ ] Start Search button ⏳

---

## Sprint 6: Stage 3 - Company Discovery

### Apollo Integration ⏳

- [ ] Create apolloClient.searchCompanies() ⏳
- [ ] Handle pagination (if needed) ⏳
- [ ] Error handling + retry logic ⏳

### Database Operations ⏳

- [ ] Create search record ⏳
- [ ] Batch insert companies ⏳
- [ ] Update search progress ⏳

### Background Job ⏳

- [ ] Create 'company-discovery' job handler ⏳
- [ ] Queue job when user clicks "Start" ⏳
- [ ] Test job execution ⏳

---

## Sprint 7: Stage 4 - Company Validation

### Website Scraping ⏳

- [ ] Create firecrawlClient.scrape() ⏳
- [ ] Batch processing with rate limiting ⏳
- [ ] Timeout handling (30s max) ⏳
- [ ] Save scraped data to database ⏳
- [ ] Checkpoint after every 50 companies ⏳

### DeepSeek Validation ⏳

- [ ] Create deepseekClient.validate() ⏳
- [ ] Create validation prompt template ⏳
- [ ] Parse JSON response ⏳
- [ ] Save score + reasoning to database ⏳

### Conflict Detection ⏳

- [ ] Identify conflicts (Apollo vs website data) ⏳
- [ ] Auto-resolve conflicts (trust website) ⏳
- [ ] Log conflicts for future review ⏳

### Filtering ⏳

- [ ] Mark companies with score 1 as REJECTED ⏳
- [ ] Mark companies with score 2-5 as VALIDATED ⏳

---

## Sprint 8: Stage 5 - Contact Discovery

### Apollo Contacts Integration ⏳

- [ ] Create apolloClient.findContacts() ⏳
- [ ] Parse target role into search terms ⏳
- [ ] De-duplication logic ⏳
- [ ] Save contacts to database ⏳

---

## Sprint 9: Stage 6 - Email Enrichment

### Apollo Email Integration ⏳

- [ ] Create apolloClient.getEmail() ⏳
- [ ] Batch processing ⏳
- [ ] Checkpoint saving every 50 contacts ⏳
- [ ] Error handling ⏳

### Crash Recovery ⏳

- [ ] Implement resumeEmailEnrichment() ⏳
- [ ] Test crash recovery (kill worker mid-process) ⏳

---

## Sprint 10: Stage 7 - Email Validation

### Million Verifier Integration ⏳

- [ ] Create mvClient.uploadBatch() ⏳
- [ ] Polling for batch results ⏳
- [ ] Parse validation results ⏳
- [ ] Update contacts with emailStatus ⏳

### Categorization ⏳

- [ ] Categorize valid, risky, invalid ⏳
- [ ] Update search summary stats ⏳

---

## Sprint 11: Stage 9 - Reporting

### Report Generation ⏳

- [ ] Generate summary statistics ⏳
- [ ] Generate cost breakdown ⏳
- [ ] Generate quality metrics ⏳
- [ ] Generate failure analysis ⏳

### Results UI ⏳

- [ ] Results table view ⏳
- [ ] Filtering and sorting ⏳
- [ ] CSV export ⏳
- [ ] Summary statistics display ⏳

---

## Sprint 12: Progress Tracking UI

### Real-time Progress ⏳

- [ ] Create /search/:id/progress page ⏳
- [ ] Poll for status updates ⏳
- [ ] Display current phase ⏳
- [ ] Display progress percentage ⏳
- [ ] Display stats (companies found, validated, etc.) ⏳
- [ ] Estimated completion time ⏳

---

## Sprint 13: Testing & Bug Fixes

### Manual Testing ⏳

- [ ] Test full workflow end-to-end ⏳
- [ ] Test with Angela's real client ICP ⏳
- [ ] Compare results quality vs manual process ⏳
- [ ] Measure time saved ⏳

### Bug Fixes ⏳

- [ ] Fix bugs discovered during testing ⏳
- [ ] Document bugs and fixes in DECISIONS.md ⏳

---

## Sprint 14: Polish & Launch

### Documentation ⏳

- [ ] User guide (how to use the platform) ⏳
- [ ] API key setup guide ⏳
- [ ] Troubleshooting guide ⏳

### Deployment ⏳

- [ ] Deploy to Vercel ⏳
- [ ] Set up environment variables ⏳
- [ ] Deploy workers to Railway ⏳
- [ ] Test production deployment ⏳

### Handoff to Angela ⏳

- [ ] Walkthrough demo ⏳
- [ ] Train on how to use ⏳
- [ ] Train on how to troubleshoot ⏳

---

## Backlog (Post-MVP)

### Phase 8: Rollback Capability

- [ ] Design partial re-run API
- [ ] Implement phase-specific re-run functions
- [ ] UI for selecting records to re-run

### Phase 10: Learning Loop

- [ ] Track success rates per industry
- [ ] Track ICP pattern recognition
- [ ] Display insights to user

### Phase 11: Self-Healing

- [ ] Implement timeout detection
- [ ] Health dashboard UI
- [ ] Auto-restart stuck jobs

### Multi-Source Email Enrichment

- [ ] Integrate Prospeo
- [ ] Integrate Expandi
- [ ] Fallback logic (Apollo → Prospeo → Expandi)

### Advanced Features

- [ ] Saved ICP profiles
- [ ] Search history browsing
- [ ] Email notifications on completion
- [ ] PDF report export
- [ ] Multi-user support
- [ ] API access for programmatic searches

---

## Blockers & Risks

### Current Blockers

- [ ] API keys for Apollo, DeepSeek, Firecrawl, Million Verifier (needed for Sprint 4+)
- [ ] Supabase account signup (needed for production; local PostgreSQL used for dev)

### Potential Blockers

- [ ] Redis hosting (might need paid tier)

### Mitigations

- Document setup steps clearly
- Have fallback hosting options (Railway vs Render)
- Budget for paid tiers if needed ($10-20/month)

---

**Last Updated:** 2026-08-02
**Current Sprint:** Environment Setup ✅
**Next Sprint:** Stage 0 - Search Form UI ⏳
**MVP Target Date:** 2026-10-02 (2 months)
