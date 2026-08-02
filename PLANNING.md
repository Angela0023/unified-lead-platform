# Planning Document - Unified Lead Platform

> **Complete planning discussion and requirements captured on 2026-08-02**

---

## The Problem We're Solving

### Current Manual Workflow (40 hours/week per client)

1. **Company Discovery**
   - Go to Sales Navigator or Expandi
   - Manually search for companies matching ICP criteria
   - Export lists

2. **Data Enrichment**
   - Upload to Expandi to get decision maker contacts
   - Export results

3. **Email Finding**
   - Enrich list with Expandi email finder
   - Keep only valid emails from Expandi
   - Remove tricky, spammy, and invalid emails

4. **Email Validation - First Pass**
   - Upload to Million Verifier
   - Get results: valid, invalid, risky
   - Keep valid, check risky separately

5. **Risky Email Validation**
   - Take "risky" emails from Million Verifier
   - Upload to BounceBan for second verification
   - Keep those that pass

6. **Fallback Email Finding**
   - Take leads with no email or invalid email
   - Search on Prospeo
   - Repeat verification process

7. **Final Fallback**
   - Still missing emails → try Apollo
   - Repeat verification

8. **Company Validation (Sometimes Skipped Due to Time)**
   - Scrape company website
   - Use Claude/DeepSeek to check if company matches ICP
   - Score 1-5 (1=not fit, 5=perfect fit)
   - Remove 1s
   - **Problem:** This is done AFTER enrichment, wasting credits on bad fits

9. **Backup Contact Finding**
   - If decision maker has no valid email anywhere
   - Find alternative contacts from same company with similar role

**Total Time:** 40 hours per week per client
**Pain Points:**
- Extremely manual and repetitive
- Expensive (paying for multiple tool subscriptions)
- Wasting credits enriching companies that aren't good fits
- Easy to make errors in the multi-step process

---

## The Vision - Automated Lead Intelligence Platform

### What the User Sees

**Input:**
- Simple web form with filters:
  - Industry
  - Company size (employee count)
  - Location/region
  - Target role/title
- Text area for ICP prompt (plain English description)
  - Example: "B2B SaaS companies selling to enterprises, must have 50-200 employees, must offer API-first products, preferably in fintech or healthcare verticals"

**Click:** "Find Leads"

**Progress Updates (Real-time):**
- "Found 247 companies matching criteria..."
- "Validating 247 companies against your ICP... keeping 156 good fits"
- "Finding decision makers at 156 companies... found 203 contacts"
- "Enriching 203 contacts... found 147 emails"
- "Validating 147 emails... 112 valid, 8 risky, 27 invalid"
- "Estimated completion: 42 minutes"

**Output:**
- CSV download with columns:
  - Company Name
  - Company Score (2-5, based on ICP)
  - Company Website
  - Decision Maker Name
  - Title
  - Email
  - Email Status (valid/risky)
  - LinkedIn Profile
- Summary stats: "Found 112 validated leads from 247 companies (45% success rate)"

**Time:** 15 minutes of user effort (5 min setup, 10 min review)

---

## The Optimal Workflow (Designed by Claude)

> **📖 Full workflow details:** See [WORKFLOW.md](WORKFLOW.md) for complete 11-stage quality gate system
> **📋 Quality gates:** See [QUALITY-GATES.md](QUALITY-GATES.md) for detailed gate implementation
> **⚙️ Architecture:** See [ARCHITECTURE.md](ARCHITECTURE.md) for technical stack and design

**Note:** This workflow has been enhanced with an 11-stage quality gate framework (inspired by enterprise deployment processes) to ensure reliability, cost control, and graceful failure handling.

### Phase 1: Company Discovery
**Tool:** Apollo Company Search API
**Input:** Industry, company size, location filters
**Process:**
- Query Apollo's company database
- Get list of companies matching basic criteria
- Return: Company name, website, size, industry, location
**Output:** 100-500 companies
**Why Apollo First:** Fastest, most reliable, you already have subscription

---

### Phase 2: Company Intelligence & Validation (THE KEY INNOVATION)
**Tools:** Apify/Firecrawl (scraping) + DeepSeek (AI validation)
**Input:** List of companies from Phase 1 + user's ICP prompt
**Process:**
1. For each company: Scrape website (homepage, about page, product pages)
2. Extract: What the company does, industries they serve, products/services, company size indicators, tech stack mentions
3. Feed to DeepSeek with prompt:
   ```
   Here is information about a company:
   [scraped website content]

   Here is the ideal customer profile:
   [user's ICP prompt]

   Score this company from 1-5:
   - 1 = Not a fit at all
   - 2 = Potential fit (some overlap)
   - 3 = Okay fit (meets basic criteria)
   - 4 = Good fit (meets most criteria)
   - 5 = Perfect fit (meets all criteria)

   Return: Score and brief explanation why.
   ```
4. Filter: Keep companies scored 2-5, discard 1s
**Output:** Validated companies (typically 50-70% of original list)
**Why This Matters:** Saves massive credits by not enriching bad fits
**Cost:** ~$0.05-0.10 per company (DeepSeek is very cheap)

---

### Phase 3: Contact Discovery
**Tool:** Apollo Contacts API
**Input:** Validated companies + target role/title
**Process:**
- For each validated company: Search for people matching role
- Return: Name, title, LinkedIn URL, company association
**Output:** List of decision makers (1-3 per company typically)
**Why Apollo:** Best B2B contact database

---

### Phase 4: Email Enrichment
**Tool:** Apollo Email Enrichment API (primary)
**Input:** List of contacts from Phase 3
**Process:**
- Batch enrich contacts with emails
- Log which emails found vs. not found
**Output:** Contacts with emails (typically 60-80% success rate)
**Future Enhancement:** Add Prospeo/Expandi fallback for contacts where Apollo fails

---

### Phase 5: Email Validation
**Tool:** Million Verifier API
**Input:** All emails from Phase 4
**Process:**
- Batch verify all emails
- Categorize: valid, invalid, risky, unknown
- Keep: valid + risky (with warning flag)
- Discard: invalid
**Output:** Validated emails
**Why Million Verifier:** You already have subscription, reliable results

---

### Phase 6: Fallback Contact Discovery (Future Enhancement)
**When:** If decision maker at company has no valid email after Phase 5
**Process:**
- Search for alternative contacts at same company
- Match similar role/seniority level
- Repeat email enrichment + validation
- Ensures "no company left behind"
**Status:** Not in MVP, add after core workflow validated

---

### Phase 7: Result Delivery
**Format:** CSV download
**Includes:**
- All validated leads
- Company fit scores
- Email validation status
- Summary statistics
**UI:** Filterable table view before download

---

## Technical Architecture

### Frontend
**Framework:** Next.js 14 (App Router)
**UI Library:** Tailwind CSS + Shadcn UI components
**Features:**
- Search form with filters + ICP prompt
- Real-time progress tracker (websockets or polling)
- Results table with sorting/filtering
- CSV export

**Hosting:** Vercel (free tier)

---

### Backend
**Framework:** Next.js API Routes
**Database:** PostgreSQL (Supabase free tier - 500MB)
**Queue System:** BullMQ + Redis (for background job processing)
**Architecture:**
- API Routes handle user requests
- Background workers process searches asynchronously
- WebSockets for real-time progress updates

**Jobs in Queue:**
1. Company Discovery Job
2. Company Validation Job (batch process with DeepSeek)
3. Contact Discovery Job
4. Email Enrichment Job
5. Email Validation Job
6. Result Compilation Job

**Hosting:** Vercel (API routes) + Railway or Render (worker processes, free tier)

---

### External APIs & Integrations

| Tool | Purpose | Cost Structure | When Used |
|------|---------|---------------|-----------|
| **Apollo** | Company search, contact discovery, email enrichment | You have subscription | Phase 1, 3, 4 |
| **DeepSeek** | AI company validation | ~$0.10-0.30 per 1000 tokens | Phase 2 |
| **Firecrawl or Apify** | Website scraping | $0-0.50 per scrape depending on plan | Phase 2 |
| **Million Verifier** | Email validation | You have subscription | Phase 5 |
| **BounceBan** (future) | Secondary email validation for risky emails | Pay per verification | Phase 5 (risky emails only) |
| **Prospeo** (future) | Fallback email enrichment | You have subscription | Phase 4 (fallback) |
| **Expandi** (future) | Fallback email enrichment | You have subscription | Phase 4 (fallback) |

---

### Database Schema (Simplified)

**searches** table:
- id, user_id, status (pending/running/completed/failed)
- filters (JSON: industry, size, location, role)
- icp_prompt (text)
- created_at, completed_at
- summary_stats (JSON)

**companies** table:
- id, search_id, name, website, industry, size, location
- score (1-5), score_reasoning (text)
- scraped_data (JSON)
- status (discovered/validated/rejected)

**contacts** table:
- id, company_id, name, title, linkedin_url
- email, email_status (valid/invalid/risky/unknown)
- source (apollo/prospeo/expandi)

**jobs** table (BullMQ stores this automatically, but we track for UI):
- id, search_id, job_type, status, progress_percent
- error_message (if failed)

---

## MVP Scope - What We Build First

### ✅ Included in MVP

1. **Search Input Form**
   - Industry filter (dropdown from Apollo's supported industries)
   - Company size filter (employee count ranges)
   - Location filter (country/region)
   - Target role/title (text input)
   - ICP prompt (textarea)

2. **Phase 1-5 Workflow**
   - Apollo company search
   - Website scraping + DeepSeek validation
   - Apollo contact discovery
   - Apollo email enrichment
   - Million Verifier validation

3. **Real-time Progress Tracking**
   - Show current phase
   - Show counts (companies found, validated, contacts enriched, etc.)
   - Estimated completion time

4. **Results Display & Export**
   - Table view of results
   - Basic filtering/sorting
   - CSV download
   - Summary statistics

5. **Simple Authentication**
   - Password-protected (just for Angela's use)
   - No complex user management needed yet

### ❌ Deferred to Later

1. Fallback email enrichment (Prospeo, Expandi)
2. BounceBan secondary validation
3. Alternative contact discovery (backup contacts at same company)
4. Saved ICP profiles (re-use same ICP for multiple searches)
5. Search history / past results browsing
6. Multi-user support / team features
7. Webhook notifications when search completes
8. API for programmatic access

---

## User Requirements & Constraints

### From Angela's Brief

1. **Budget Constraint:** Minimal upfront investment. Use existing subscriptions (Apollo, Million Verifier, Expandi, Prospeo). Hosting on free tiers where possible.

2. **Testing Plan:** Use with current clients first to validate it works. Once proven, scale to more clients and potentially external SaaS offering.

3. **ICP Variability:** Each client has different ICP criteria, so the system needs flexible ICP input (not hardcoded).

4. **Stability Requirement (CRITICAL):**
   - Modular architecture: Changes to one integration don't break others
   - Version control with feature branches
   - Automated testing (add after MVP proven)
   - Every component isolated
   - Database migrations versioned and reversible

5. **Documentation & GitHub Protocol (CRITICAL):**
   - After ANY feature/fix completion, ask: "Should I push this to GitHub with [description]?"
   - Every commit includes: what changed, why, lessons learned
   - Maintain CHANGELOG.md for all updates
   - Design decisions in DECISIONS.md
   - Before moving to next topic, push current work

6. **File Organization (CRITICAL):**
   - Everything in separate files
   - No mixing concerns
   - Easy to modify individual components
   - Clear structure

---

## Example Use Case (Real Client Search)

**Client:** B2B SaaS lead generation
**ICP Prompt:** "B2B SaaS companies in fintech or healthcare verticals, 50-200 employees, must offer API-first products or developer tools, based in US or UK, selling to enterprises"

**Filters:**
- Industry: Software Development, Financial Services, Healthcare
- Company Size: 50-200 employees
- Location: United States, United Kingdom
- Target Role: CTO, VP Engineering, Head of Product

**Expected Workflow:**
1. Apollo finds 300 companies
2. DeepSeek validates against ICP → keeps 180 (60%)
3. Apollo finds decision makers → 220 contacts
4. Apollo enriches emails → finds 150 (68%)
5. Million Verifier validates → 115 valid, 10 risky, 25 invalid
6. Final output: 125 qualified leads (115 valid + 10 risky flagged)

**Time:** 45-60 minutes automated vs. 40 hours manual

---

## Success Metrics

**For Angela (Internal Use):**
- Time saved per search: Target 95% reduction (40 hours → 2 hours max)
- Lead quality: Same or better than manual process
- Cost per lead: Lower than current process (saved labor >> API costs)
- Ability to take on more clients due to time savings

**For Future SaaS Offering:**
- User can complete a search without support
- Results delivered within 60 minutes
- Lead quality meets expectations (measured by email open rates in campaigns)
- Credit optimization (don't waste credits on bad fits)

---

## Next Steps (See TODO.md for detailed tasks)

1. Set up GitHub repo and push all documentation ✅ (in progress)
2. Set up local development environment
3. Create database schema
4. Build MVP frontend (search form)
5. Implement Phase 1 (Apollo company search)
6. Implement Phase 2 (scraping + DeepSeek validation)
7. Test with one real client search
8. Iterate based on results

---

**Last Updated:** 2026-08-02
**Status:** Planning Complete, Ready for Development
**Owner:** Angela Petkovska
