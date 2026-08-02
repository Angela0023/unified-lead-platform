# Technical Architecture - Unified Lead Platform

> **Detailed technical design ensuring stability, modularity, and scalability**

---

## Core Architectural Principles

> **See also:** [QUALITY-GATES.md](QUALITY-GATES.md) for the 11-stage quality gate system
> **See also:** [DEVELOPMENT-WORKFLOW.md](DEVELOPMENT-WORKFLOW.md) for safe development practices

### 1. Modular Integration Design
**Principle:** Each external tool integration is completely isolated.

**Why:** Changes to Apollo integration cannot break Prospeo integration. A bug in email validation doesn't affect company discovery.

**Quality Gate Alignment:** This supports Stage 3 (Isolated Execution) - each search runs independently without interference.

**How:**
```
/src
  /integrations
    /apollo
      - client.ts          (API wrapper)
      - types.ts           (TypeScript types)
      - errors.ts          (Apollo-specific errors)
      - __tests__/         (Tests for Apollo only)
    /deepseek
      - client.ts
      - types.ts
      - errors.ts
      - __tests__/
    /million-verifier
      - client.ts
      - types.ts
      - errors.ts
      - __tests__/
    /firecrawl
      - client.ts
      - types.ts
      - errors.ts
      - __tests__/
```

Each integration exports a clean interface. The rest of the app only uses that interface, never calls APIs directly.

---

### 2. Background Job Processing
**Principle:** Long-running tasks happen in background workers, not API routes.

**Why:**
- Searches can take 30-60 minutes
- API routes timeout after 30 seconds on Vercel
- Users need real-time progress updates

**How:**
- User submits search → API route creates database record + queues job → returns immediately
- Background worker picks up job → runs all phases
- WebSocket or polling provides real-time updates
- User downloads results when complete

---

### 3. Database-First State Management
**Principle:** Database is the source of truth, not in-memory state.

**Why:**
- Workers can crash and restart mid-search
- Multiple workers can process different phases
- Users can close browser and come back later

**How:**
- Every phase updates database with progress
- Jobs store intermediate results in DB
- Frontend polls database for status
- Workers are stateless (can be restarted safely)

---

### 4. Graceful Failure Handling
**Principle:** One failed contact doesn't break the entire search.

**Why:** External APIs fail sometimes (rate limits, timeouts, bad data). We need to continue processing other leads.

**How:**
- Try/catch around individual API calls
- Log errors to database
- Mark individual records as failed
- Continue processing batch
- Final report shows: X succeeded, Y failed with reasons

---

## Technology Stack

### Frontend
**Framework:** Next.js 14 (App Router)
**Why:** React-based, great DX, built-in API routes, easy Vercel deployment

**UI Components:** Shadcn UI (built on Radix UI + Tailwind)
**Why:** Beautiful, accessible, customizable, free

**Styling:** Tailwind CSS
**Why:** Rapid development, consistent design system

**State Management:** React Query (TanStack Query)
**Why:** Perfect for server state (polling, caching, refetching)

**Real-time Updates:** Polling (upgrade to WebSockets later if needed)
**Why:** Simpler for MVP, works everywhere, no WebSocket server needed initially

---

### Backend
**Runtime:** Node.js (Next.js API Routes + Background Workers)
**Why:** JavaScript end-to-end, leverage existing libraries

**Database:** PostgreSQL (via Supabase)
**Why:**
- Relational data (searches → companies → contacts)
- JSONB for flexible data storage (API responses)
- Free tier: 500MB (plenty for testing)
- Built-in auth if we need it later

**Queue System:** BullMQ + Redis
**Why:**
- Reliable background jobs
- Built-in retry logic
- Job progress tracking
- Cron-like scheduling if needed
- Industry standard

**ORM:** Prisma
**Why:**
- TypeScript-first
- Migrations handled automatically
- Great DX
- Type-safe database queries

---

### External APIs

| Service | Purpose | Rate Limits (Estimate) | Error Handling |
|---------|---------|----------------------|----------------|
| **Apollo.io** | Company search, contact discovery, email enrichment | Depends on plan, typically 100-500 req/min | Retry with exponential backoff, log failures |
| **DeepSeek** | AI company validation | 100 req/min (generous) | Batch requests, retry on 429/500 |
| **Firecrawl** | Website scraping | 10-50 req/min depending on plan | Fallback to basic fetch if fails |
| **Million Verifier** | Email validation | Batch uploads (1000s at once) | Retry entire batch on failure |

**Retry Strategy:**
- 3 retries with exponential backoff (1s, 2s, 4s)
- Log errors to database
- Mark individual record as failed
- Continue processing batch
- Final report shows failure rate

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  (Next.js App - Vercel Hosted)                             │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Search Form │  │   Progress   │  │   Results    │     │
│  │             │→ │   Tracker    │→ │   Table      │     │
│  │ (Input ICP) │  │ (Real-time)  │  │ (Download)   │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │             │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          │ POST /api/      │ GET /api/        │ GET /api/
          │ searches        │ searches/:id     │ searches/:id/
          │                 │ /status          │ download
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)                 │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Create       │  │ Get Status   │  │  Download    │    │
│  │ Search       │  │              │  │  Results     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │             │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                  │
          │ Queue Job       │ Query DB         │ Query DB
          ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                    │
│                                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │ searches │  │ companies │  │ contacts │  │   jobs   │ │
│  └──────────┘  └───────────┘  └──────────┘  └──────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
          ▲                                    │
          │ Read/Write                         │ Queue Job
          │                                    ▼
┌─────────────────────────────────────────────────────────────┐
│              Job Queue (BullMQ + Redis)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Job: Process Search #123                           │ │
│  │  Phases:                                             │ │
│  │   [✓] Company Discovery                             │ │
│  │   [→] Company Validation (in progress)              │ │
│  │   [ ] Contact Discovery                             │ │
│  │   [ ] Email Enrichment                              │ │
│  │   [ ] Email Validation                              │ │
│  └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│            Background Workers (Node.js)                     │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  Phase 1-2  │  │  Phase 3-4  │  │   Phase 5   │       │
│  │   Worker    │  │   Worker    │  │   Worker    │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │               │
└─────────┼────────────────┼────────────────┼───────────────┘
          │                │                │
          │ API Calls      │ API Calls      │ API Calls
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   External APIs                             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Apollo  │  │ DeepSeek │  │Firecrawl │  │  Million │  │
│  │          │  │          │  │          │  │ Verifier │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model Search {
  id                String      @id @default(uuid())
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  completedAt       DateTime?

  // Input
  industry          String[]
  companySize       String      // e.g., "50-200"
  location          String[]
  targetRole        String
  icpPrompt         String      @db.Text

  // Status
  status            SearchStatus @default(PENDING)
  currentPhase      String?     // "Company Discovery", "Validation", etc.
  progressPercent   Int         @default(0)
  errorMessage      String?     @db.Text

  // Results Summary
  companiesFound    Int         @default(0)
  companiesValidated Int        @default(0)
  contactsFound     Int         @default(0)
  emailsFound       Int         @default(0)
  emailsValid       Int         @default(0)

  // Relations
  companies         Company[]
  jobs              Job[]
}

enum SearchStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

model Company {
  id                String      @id @default(uuid())
  searchId          String
  search            Search      @relation(fields: [searchId], references: [id])

  // Basic Info
  name              String
  website           String
  industry          String?
  size              Int?
  location          String?

  // Validation
  score             Int?        // 1-5
  scoreReasoning    String?     @db.Text
  scrapedData       Json?       // Full website scrape result

  // Status
  status            CompanyStatus @default(DISCOVERED)
  errorMessage      String?

  // Relations
  contacts          Contact[]

  createdAt         DateTime    @default(now())
}

enum CompanyStatus {
  DISCOVERED
  VALIDATED
  REJECTED
  FAILED
}

model Contact {
  id                String      @id @default(uuid())
  companyId         String
  company           Company     @relation(fields: [companyId], references: [id])

  // Basic Info
  name              String
  title             String
  linkedinUrl       String?

  // Email
  email             String?
  emailStatus       EmailStatus?
  emailSource       String?     // "apollo", "prospeo", "expandi"

  // Status
  status            ContactStatus @default(DISCOVERED)
  errorMessage      String?

  createdAt         DateTime    @default(now())
}

enum EmailStatus {
  VALID
  INVALID
  RISKY
  UNKNOWN
}

enum ContactStatus {
  DISCOVERED
  EMAIL_FOUND
  EMAIL_VALIDATED
  FAILED
}

model Job {
  id                String      @id @default(uuid())
  searchId          String
  search            Search      @relation(fields: [searchId], references: [id])

  jobType           String      // "company-discovery", "validation", etc.
  status            JobStatus   @default(PENDING)
  progressPercent   Int         @default(0)
  errorMessage      String?     @db.Text

  createdAt         DateTime    @default(now())
  startedAt         DateTime?
  completedAt       DateTime?
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

---

## API Endpoints

### POST /api/searches
**Purpose:** Create new search
**Input:**
```json
{
  "industry": ["Software", "Financial Services"],
  "companySize": "50-200",
  "location": ["United States", "United Kingdom"],
  "targetRole": "CTO",
  "icpPrompt": "B2B SaaS companies..."
}
```
**Output:**
```json
{
  "searchId": "uuid-here",
  "status": "pending",
  "message": "Search queued successfully"
}
```

---

### GET /api/searches/:id/status
**Purpose:** Get real-time status
**Output:**
```json
{
  "id": "uuid",
  "status": "running",
  "currentPhase": "Company Validation",
  "progressPercent": 45,
  "stats": {
    "companiesFound": 247,
    "companiesValidated": 112,
    "contactsFound": 0,
    "emailsFound": 0,
    "emailsValid": 0
  },
  "estimatedCompletion": "2026-08-02T15:30:00Z"
}
```

---

### GET /api/searches/:id/results
**Purpose:** Get final results for display
**Output:**
```json
{
  "searchId": "uuid",
  "summary": {
    "totalLeads": 125,
    "companiesProcessed": 247,
    "successRate": 0.51
  },
  "leads": [
    {
      "company": "Acme Corp",
      "companyScore": 4,
      "website": "acme.com",
      "name": "John Doe",
      "title": "CTO",
      "email": "john@acme.com",
      "emailStatus": "valid",
      "linkedinUrl": "linkedin.com/in/johndoe"
    }
  ]
}
```

---

### GET /api/searches/:id/download
**Purpose:** Download results as CSV
**Output:** CSV file stream

---

## Background Job Processing

### Job Flow

1. **User Creates Search** → API creates database record + queues job
2. **Worker Picks Up Job** → Reads search parameters from DB
3. **Phase 1: Company Discovery**
   - Call Apollo API
   - Insert companies into database
   - Update job progress
4. **Phase 2: Company Validation**
   - For each company: scrape website
   - Batch validate with DeepSeek (10 at a time)
   - Update company records with scores
   - Mark rejected companies
   - Update job progress
5. **Phase 3: Contact Discovery**
   - For validated companies: find contacts via Apollo
   - Insert contacts into database
   - Update job progress
6. **Phase 4: Email Enrichment**
   - For each contact: get email from Apollo
   - Update contact records
   - Update job progress
7. **Phase 5: Email Validation**
   - Batch all emails to Million Verifier
   - Update contact records with status
   - Update job progress
8. **Mark Search Complete** → Update search status, set completedAt

### Error Handling in Workers

```typescript
// Pseudocode
async function processContact(contact) {
  try {
    const email = await apolloClient.getEmail(contact.id);
    await db.contact.update({
      where: { id: contact.id },
      data: {
        email,
        status: 'EMAIL_FOUND',
        emailSource: 'apollo'
      }
    });
  } catch (error) {
    // Log error but continue
    await db.contact.update({
      where: { id: contact.id },
      data: {
        status: 'FAILED',
        errorMessage: error.message
      }
    });
    logger.error(`Failed to enrich contact ${contact.id}`, error);
  }
}
```

**Key:** Individual failures don't stop the search. We log them and continue.

---

## Deployment Architecture

### MVP Deployment (Free Tier)

**Frontend + API Routes:**
- **Host:** Vercel
- **Cost:** $0 (Hobby plan)
- **Limitations:** Serverless functions timeout after 30 seconds (fine for API routes)

**Database:**
- **Host:** Supabase
- **Cost:** $0 (Free tier: 500MB, unlimited API requests)
- **Limitations:** 500MB storage (plenty for MVP - thousands of searches)

**Redis + Background Workers:**
- **Host:** Railway or Render
- **Cost:** $0 (Free tier available on both)
- **Limitations:** Sleep after inactivity (fine for testing), limited RAM

**Estimated Total Cost:** $0/month for MVP testing phase

### Production Deployment (Future)

When scaling beyond MVP:
- Vercel Pro: $20/month (better performance, more functions)
- Supabase Pro: $25/month (8GB storage, backups)
- Redis Cloud or Railway Pro: $5-10/month (dedicated resources)
- **Total: ~$50-60/month** (supports hundreds of searches)

---

## Security Considerations

### API Keys Storage
**NEVER commit to GitHub:**
- `.env.local` for local development
- Vercel environment variables for production
- `.gitignore` includes `.env*`

**Required Environment Variables:**
```
APOLLO_API_KEY=
DEEPSEEK_API_KEY=
FIRECRAWL_API_KEY=
MILLION_VERIFIER_API_KEY=
DATABASE_URL=
REDIS_URL=
```

### Authentication (MVP)
**Simple password protection:**
- Single shared password (just for Angela's use)
- Stored in environment variable
- Required to access the app

**Future:** Proper user accounts with Supabase Auth

---

## Monitoring & Logging

### MVP Logging
- Console.log for development
- Database records for job errors
- Simple error reporting in UI

### Future Enhancements
- Sentry for error tracking
- PostHog or Mixpanel for analytics
- Cost tracking per search (API call costs)
- Success rate monitoring
- Alert on high failure rates

---

## Testing Strategy

### MVP (Manual Testing)
- Test each phase independently with small data sets
- Validate API integrations one at a time
- Run full search with Angela's real client ICP
- Check results quality vs. manual process

### Future (Automated Testing)
- Unit tests for each integration client
- Integration tests for workflow phases
- End-to-end test with mock APIs
- CI/CD pipeline on GitHub Actions

---

## Scalability Considerations

**Current MVP handles:**
- 1 concurrent user (Angela)
- ~10 searches per day
- ~200-500 companies per search
- ~500-1000 contacts per search

**When to scale:**
- 10+ concurrent users
- 100+ searches per day
- Need sub-15-minute search completion

**How to scale:**
- Add more background workers
- Upgrade database to Pro plan
- Consider caching Apollo results (deduplication)
- Batch API calls more efficiently
- Parallelize independent phases

---

**Last Updated:** 2026-08-02
**Status:** Architecture Defined
**Next:** Begin implementation
