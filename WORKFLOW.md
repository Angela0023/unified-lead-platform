# Lead Generation Workflow - Unified Lead Platform

> **Complete step-by-step workflow from user input to delivered leads, incorporating quality gates and checkpoints**

---

## Overview

The workflow follows an 11-stage quality gate system adapted from enterprise software deployment processes, ensuring reliability, cost transparency, and graceful failure handling.

**Total Process Time:** 45-60 minutes (automated)
**User Effort:** 5 minutes setup + 10 minutes review = 15 minutes total
**Time Saved vs Manual:** 40 hours → 15 minutes (160x improvement)

---

## Stage 0: Prompt Intake & Structuring

**What happens:** User inputs raw search criteria, system structures it into executable search plan

### User Input:
1. **Filters (Structured Data):**
   - Industry: Dropdown/multi-select (Software, Financial Services, Healthcare, etc.)
   - Company Size: Dropdown (1-10, 11-50, 51-200, 201-500, 501-1000, 1000+)
   - Location: Multi-select (United States, United Kingdom, Germany, etc.)
   - Target Role: Text input (CTO, VP Engineering, Head of Product, etc.)

2. **ICP Prompt (Natural Language):**
   - Textarea for detailed ICP description
   - Example: "B2B SaaS companies selling to enterprises, must have 50-200 employees, must offer API-first products or developer tools, preferably in fintech or healthcare verticals, must have raised Series A or later funding"

### System Processing:
- Validates input (all required fields filled)
- Structures natural language prompt into validation criteria for DeepSeek
- Generates initial search parameters for Apollo
- Shows user: "Here's what we understood from your input. Does this look correct?"

### Output:
- Structured search configuration
- User confirmation before proceeding

**Status:** ✅ MVP Required

---

## Stage 1: Pre-flight Environment Gates

**What happens:** System validates environment health BEFORE spending any credits or starting search

### Health Checks (All Must Pass):

1. **API Key Validation:**
   - ✅ Apollo API key valid and authenticated
   - ✅ DeepSeek API key valid and authenticated
   - ✅ Firecrawl API key valid and authenticated
   - ✅ Million Verifier API key valid and authenticated

2. **Credit Balance Checks:**
   - ✅ Apollo credits sufficient (estimate: 500 credits needed for typical search)
   - ✅ Million Verifier credits sufficient (estimate: 200 verifications needed)
   - ✅ Firecrawl credits sufficient (estimate: 200 scrapes needed)

3. **Infrastructure Health:**
   - ✅ Database connection active
   - ✅ Redis connection active (for job queue)
   - ✅ Background worker processes running

4. **Rate Limit Status:**
   - ✅ Apollo API not rate-limited (within daily/hourly quota)
   - ✅ DeepSeek API not rate-limited
   - ✅ Other APIs not rate-limited

### Failure Handling:
- **If ANY check fails → Do NOT start search**
- Show specific error to user: "Apollo API key invalid. Please update in settings."
- Prevent wasted time and credits on doomed searches

### Output:
- ✅ All systems operational → Proceed to Stage 2
- ❌ Any system down → Show error, halt process

**Status:** ✅ MVP Required (Critical for reliability)

---

## Stage 2: Scope + Plan (Cost & Time Estimation)

**What happens:** System calculates estimated cost, time, and credit usage BEFORE executing. User approves or cancels.

### Estimation Logic:

1. **Companies Expected:**
   - Based on filters, estimate company count from Apollo
   - Example: "Software companies, 50-200 employees, US/UK" → ~500 companies estimated

2. **Cost Breakdown:**
   - Apollo company search: $0.50-1.00 (bulk query)
   - Website scraping (500 companies): ~$5-10 (Firecrawl at $0.01-0.02 per scrape)
   - DeepSeek validation (500 companies): ~$2-5 (very cheap, $0.004-0.01 per company)
   - Apollo contact discovery (300 validated companies): ~$3-6
   - Apollo email enrichment (400 contacts): ~$4-8
   - Million Verifier (300 emails): ~$1.50-3.00
   - **Total Estimated Cost: $16.50-33.00**

3. **Time Breakdown:**
   - Company discovery: 2-5 minutes
   - Website scraping: 15-20 minutes (rate-limited)
   - DeepSeek validation: 5-10 minutes
   - Contact discovery: 5-10 minutes
   - Email enrichment: 5-10 minutes
   - Email validation: 5-10 minutes
   - **Total Estimated Time: 37-65 minutes**

4. **Credit Usage:**
   - Apollo credits: ~800-1000
   - Firecrawl credits: ~500
   - Million Verifier credits: ~300
   - Total credits: ~1600-1800

### User Approval:
System shows summary:
```
Search Plan Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimated Companies: ~500
Estimated Final Leads: ~120-150 (based on typical 24-30% success rate)

Cost Estimate: $16.50 - $33.00
Time Estimate: 40-65 minutes
Credits Required: ~1,600-1,800

Breakdown:
  Phase 1: Company Discovery         $1.00    2 min
  Phase 2: Company Validation        $7.50   20 min
  Phase 3: Contact Discovery         $4.50    7 min
  Phase 4: Email Enrichment          $6.00    8 min
  Phase 5: Email Validation          $2.25    5 min

[Cancel]  [Start Search]
```

User clicks "Start Search" → Proceed to Stage 3

**Status:** ✅ MVP Required (Transparency & cost control)

---

## Stage 3: Isolated Execution (Phase 1 - Company Discovery)

**What happens:** Find companies matching criteria, isolated from other searches

### Process:

1. **Create Search Record:**
   - Insert into database: searches table
   - Status: RUNNING
   - Store all input parameters (filters, ICP prompt)
   - Generate unique search ID

2. **Queue Job:**
   - Create background job: "company-discovery"
   - Job runs in isolated worker (can't interfere with other searches)
   - Multiple searches can run in parallel

3. **Execute Apollo Company Search:**
   ```typescript
   // Pseudocode
   const companies = await apolloClient.searchCompanies({
     industries: ["Software", "Financial Services"],
     employeeCount: { min: 50, max: 200 },
     locations: ["United States", "United Kingdom"],
     limit: 500
   });
   ```

4. **Save Results with Checkpoint:**
   - Insert all companies into database: companies table
   - Each company marked: status = DISCOVERED
   - Update search record: companiesFound = 500
   - **CHECKPOINT SAVED** (if crash happens now, we have company list)

5. **Real-time Progress Update:**
   - Update job: progressPercent = 15%
   - Update search: currentPhase = "Company Discovery Complete"
   - Frontend polls and shows: "✓ Found 500 companies matching criteria"

### Failure Handling:
- If Apollo API fails → Retry 3 times with exponential backoff (1s, 2s, 4s)
- If still fails → Mark search as FAILED, show error to user
- No partial data saved if API call fails completely

### Output:
- 500 companies saved in database with status = DISCOVERED
- Search progresses to Stage 4

**Status:** ✅ MVP Required

---

## Stage 4: Mediator + Conflict Detection (Phase 2 - Company Validation)

**What happens:** Scrape websites, validate against ICP, detect and resolve conflicts

### Process:

1. **Website Scraping (Batch Processing):**
   - For each company: scrape website using Firecrawl
   - Rate limit: 10 requests per minute (Firecrawl limit)
   - Extract: homepage, about page, product pages, pricing page
   - Store scraped content in companies.scrapedData (JSONB field)
   - **CHECKPOINT after every 50 companies** (incremental saves)

   ```typescript
   // Batch processing with checkpoints
   for (let i = 0; i < companies.length; i += 50) {
     const batch = companies.slice(i, i + 50);
     await processBatch(batch);
     // CHECKPOINT: Progress saved to DB
     await updateProgress(i + 50);
   }
   ```

2. **DeepSeek AI Validation (Batch Processing):**
   - For each company: send scraped content + ICP prompt to DeepSeek
   - Prompt template:
   ```
   You are evaluating companies against an ideal customer profile (ICP).

   Company Information:
   Name: Acme Corp
   Website: acme.com
   Scraped Content: [content here]

   Ideal Customer Profile:
   [User's ICP prompt]

   Task:
   1. Score this company from 1-5:
      - 1 = Not a fit at all (completely wrong industry/size/offering)
      - 2 = Potential fit (some overlap but missing key criteria)
      - 3 = Okay fit (meets basic criteria, not ideal)
      - 4 = Good fit (meets most criteria, strong match)
      - 5 = Perfect fit (meets all criteria, ideal customer)

   2. Provide brief reasoning (2-3 sentences) explaining the score.

   3. Identify any conflicting signals (e.g., website says "enterprise focus" but pricing suggests SMB)

   Return JSON:
   {
     "score": 4,
     "reasoning": "Strong fit. B2B SaaS selling to enterprises, 120 employees, API-first product...",
     "conflicts": ["Website mentions SMB customers but ICP requires enterprise only"]
   }
   ```

3. **Conflict Detection & Resolution:**
   - DeepSeek identifies conflicts (e.g., company size on website differs from Apollo data)
   - System flags conflicts in database
   - **MVP:** Auto-resolve using website data as source of truth
   - **Post-MVP:** Show conflicts to user for manual resolution

4. **Filtering:**
   - Companies scored 1 → Mark status = REJECTED (not a fit)
   - Companies scored 2-5 → Mark status = VALIDATED (proceed to next phase)
   - Update search record: companiesValidated = 320 (64% pass rate)

5. **Save Checkpoint:**
   - All validation scores saved to database
   - Update search: currentPhase = "Company Validation Complete"
   - **CHECKPOINT SAVED** (can resume from here if crash)

### Conflict Examples:

| Conflict Type | Apollo Says | Website Says | Resolution |
|---------------|-------------|--------------|------------|
| Company Size | 150 employees | "Team of 80" | Trust website (more current) |
| Industry | "Software" | "Healthcare IT" | Trust website (more specific) |
| Funding Stage | "Series A" | "Bootstrapped" | Flag for user review |

### Output:
- 320 validated companies (scores 2-5)
- 180 rejected companies (score 1)
- Conflicts flagged for review
- Search progresses to Stage 5

**Status:**
- Basic validation: ✅ MVP Required
- Conflict resolution UI: 📋 Post-MVP Enhancement

---

## Stage 5: Self-Adversarial Pre-pass + Quorum (Phase 3 - Contact Discovery)

**What happens:** Multi-layer validation to catch bad data before it reaches final results

### Layer 1: Quick Format Validation (Pre-pass)

Before calling Apollo, validate our request:
- ✅ Company IDs exist in database
- ✅ Target role is valid (not empty, reasonable length)
- ✅ No duplicate company lookups
- ✅ Rate limits not exceeded

**If pre-pass fails:** Fix issues before proceeding (saves API credits)

### Layer 2: Apollo Contact Discovery (Primary Source)

1. **Find Decision Makers:**
   - For each validated company: search Apollo for people matching target role
   - Example query: "CTO OR VP Engineering OR Head of Engineering at Acme Corp"
   - Return: Name, title, LinkedIn URL, location

2. **De-duplication:**
   - If multiple people found at same company with similar title
   - Keep top 2 most senior based on title analysis
   - Example: Keep "CTO" and "VP Engineering", skip "Senior Engineering Manager"

3. **Save with Checkpoint:**
   - Insert contacts into database: contacts table
   - Status = DISCOVERED
   - Update search: contactsFound = 410
   - **CHECKPOINT SAVED**

### Layer 3: Quorum Validation (Post-MVP)

For high-confidence results, validate contacts from multiple sources:
- Primary: Apollo
- Secondary: Prospeo (if Apollo fails or for verification)
- Tertiary: Expandi (final fallback)

**Quorum logic:**
- If 2+ sources return same email for same person → HIGH CONFIDENCE
- If sources return different emails → FLAG CONFLICT
- If only 1 source returns data → MEDIUM CONFIDENCE

**Status:**
- Layer 1 & 2: ✅ MVP Required
- Layer 3 (Quorum): 📋 Post-MVP Enhancement

### Output:
- 410 contacts discovered (average 1.3 per company)
- Each contact has: name, title, LinkedIn URL, company association
- Search progresses to Stage 6

**Status:** ✅ MVP Required (without quorum logic)

---

## Stage 6: Land - Checkpoint Journaling (Phase 4 - Email Enrichment)

**What happens:** Find emails for contacts, save progress incrementally to prevent data loss on crash

### Checkpoint Strategy:

Instead of waiting until all emails enriched, save after every batch of 50:

```typescript
// Example checkpoint flow
const contacts = await getContactsForEnrichment(searchId);
const batchSize = 50;

for (let i = 0; i < contacts.length; i += batchSize) {
  const batch = contacts.slice(i, i + batchSize);

  // Process batch
  for (const contact of batch) {
    try {
      const email = await apolloClient.getEmail(contact.apolloId);

      // IMMEDIATE SAVE (crash-resistant)
      await db.contact.update({
        where: { id: contact.id },
        data: {
          email: email.address,
          emailSource: 'apollo',
          status: 'EMAIL_FOUND'
        }
      });
    } catch (error) {
      // Mark as failed, continue with others
      await db.contact.update({
        where: { id: contact.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
    }
  }

  // CHECKPOINT: Update search progress
  await db.search.update({
    where: { id: searchId },
    data: {
      emailsFound: i + batch.length,
      progressPercent: calculateProgress(i + batch.length, contacts.length)
    }
  });

  // If crash happens here, we resume from this checkpoint
  // No need to re-enrich the 50 contacts we just processed
}
```

### Crash Recovery:

If system crashes mid-enrichment:
1. Worker restarts
2. Queries database: Which contacts already have emails?
3. Resumes processing from first contact without email
4. **Zero data loss, zero duplicate API calls**

### Process:

1. **Email Enrichment (Apollo Primary):**
   - For each contact: call Apollo email enrichment API
   - Success: Save email immediately with source = 'apollo'
   - Failure: Mark contact for fallback processing
   - **Save checkpoint every 50 contacts**

2. **Fallback Processing (Post-MVP):**
   - Contacts with no email from Apollo → Try Prospeo
   - Still no email → Try Expandi
   - Track source for each email (apollo/prospeo/expandi)

3. **Result Tracking:**
   - Update search record in real-time
   - emailsFound increments as each email discovered
   - Frontend shows live count

### Output:
- 285 emails found (70% success rate)
- 125 contacts still without email (marked for fallback or skipped)
- All progress saved to database
- Search progresses to Stage 7

**Status:** ✅ MVP Required (checkpoint logic critical)

---

## Stage 7: Live Verification + Health Check (Phase 5 - Email Validation)

**What happens:** Validate all emails, perform quality sample check

### Email Validation (Million Verifier):

1. **Batch Upload:**
   - Collect all 285 emails from Phase 4
   - Upload to Million Verifier as single batch (more efficient than individual calls)
   - Wait for results (typically 5-10 minutes)

2. **Categorization:**
   - **Valid:** Email exists and is deliverable
   - **Invalid:** Email doesn't exist or mailbox full
   - **Risky:** Temporary email, catch-all domain, or suspicious
   - **Unknown:** Unable to verify

3. **Filtering:**
   - Keep: Valid + Risky (flag risky with warning)
   - Discard: Invalid + Unknown
   - Update each contact record with emailStatus

4. **Save Results:**
   - Update contacts table: emailStatus = 'valid'/'risky'/'invalid'
   - Update search: emailsValid = 215, emailsRisky = 18, emailsInvalid = 52

### Quality Sample Check (Post-MVP):

After validation, perform live health check:
1. **Sample Selection:** Randomly pick 5 validated emails
2. **SMTP Ping:** Send test SMTP connection (not actual email, just verify mailbox responds)
3. **Calculate Confidence Score:**
   - 5/5 pass → 100% confidence, results are fresh
   - 3-4/5 pass → 80% confidence, good quality
   - 0-2/5 pass → <60% confidence, data may be stale

4. **Alert User if Low Quality:**
   - "Warning: Sample check indicates 40% of emails may be stale or invalid. Consider re-running search or manually verifying leads before campaign."

**Status:**
- Email validation: ✅ MVP Required
- Sample health check: 📋 Post-MVP Enhancement

### Output:
- 215 valid emails
- 18 risky emails (flagged with warning)
- 52 invalid emails (excluded from results)
- Quality confidence score: 85%
- Search progresses to Stage 8

---

## Stage 8: Rollback / Partial Re-run Capability

**What happens:** Enable re-running failed portions without re-processing entire search

### Use Cases:

1. **User Reports Bad Data:**
   - "These 20 companies don't match my ICP at all"
   - System can re-run just Phase 2 (validation) for those 20 companies
   - No need to re-run entire search

2. **API Failure Mid-Search:**
   - Million Verifier API was down during validation
   - 100 emails never got validated
   - Re-run just Phase 5 for those 100 emails

3. **User Changes ICP Criteria:**
   - "Actually, I want to exclude companies under 100 employees"
   - Re-run Phase 2 validation with new criteria
   - No need to re-scrape websites (use cached scraped data)

### Implementation:

Database tracks status at granular level:
- Company level: DISCOVERED → VALIDATED/REJECTED
- Contact level: DISCOVERED → EMAIL_FOUND → EMAIL_VALIDATED
- Each phase can be re-run independently

```typescript
// Re-run Phase 2 (validation) for specific companies
async function revalidateCompanies(searchId, companyIds) {
  const companies = await db.company.findMany({
    where: {
      searchId,
      id: { in: companyIds }
    }
  });

  // Use existing scraped data (don't re-scrape)
  for (const company of companies) {
    const newScore = await deepseekClient.validate(
      company.scrapedData,
      search.icpPrompt
    );

    await db.company.update({
      where: { id: company.id },
      data: {
        score: newScore.score,
        scoreReasoning: newScore.reasoning,
        status: newScore.score === 1 ? 'REJECTED' : 'VALIDATED'
      }
    });
  }
}
```

**Status:** 📋 Post-MVP Enhancement (nice to have, not critical for first version)

---

## Stage 9: Report - Detailed Search Receipt

**What happens:** Generate comprehensive report showing exactly what happened, costs, success rates

### Report Contents:

#### Summary Statistics:
```
Search Report - #12345
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Completed: 2026-08-02 14:32:15
Duration: 47 minutes

Final Results:
  ✓ 215 Valid Leads
  ⚠ 18 Risky Leads (flagged)
  ✗ 52 Invalid Emails (excluded)

Total: 233 Leads from 320 Validated Companies
Success Rate: 72.8%
```

#### Phase Breakdown:
```
Phase 1: Company Discovery
  - Companies Found: 500
  - API Calls: 1 (bulk query)
  - Cost: $0.80
  - Duration: 3 minutes
  - Status: ✓ Success

Phase 2: Company Validation
  - Companies Validated: 320 (64%)
  - Companies Rejected: 180 (36%)
  - Websites Scraped: 500
  - DeepSeek Validations: 500
  - Cost: $8.20 ($5 Firecrawl + $3.20 DeepSeek)
  - Duration: 22 minutes
  - Status: ✓ Success

Phase 3: Contact Discovery
  - Contacts Found: 410
  - Average per Company: 1.3
  - API Calls: 320
  - Cost: $4.80
  - Duration: 8 minutes
  - Status: ✓ Success

Phase 4: Email Enrichment
  - Emails Found: 285 (69.5%)
  - Emails Not Found: 125
  - Source Breakdown:
    • Apollo: 285 (100%)
  - Cost: $5.70
  - Duration: 9 minutes
  - Status: ✓ Success

Phase 5: Email Validation
  - Valid: 215 (75.4%)
  - Risky: 18 (6.3%)
  - Invalid: 52 (18.2%)
  - Cost: $1.43
  - Duration: 5 minutes
  - Status: ✓ Success

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Cost: $20.93
Total Credits Used: 1,615
Total Duration: 47 minutes
```

#### Quality Metrics:
```
Data Quality Indicators:
  - Email Validation Pass Rate: 75.4% (Good)
  - Company-to-Lead Conversion: 72.8% (Excellent)
  - Average ICP Score: 3.8/5 (Strong Fit)
  - Data Freshness: ✓ All sources accessed within last 24h
```

#### Failure Analysis (if any):
```
Warnings & Failures:
  - 12 companies: Website scraping failed (timeout)
  - 5 contacts: Apollo returned incomplete data
  - 0 system errors

Recommendations:
  - 12 companies excluded due to scraping issues. Consider manual review.
  - 125 contacts have no email. Consider fallback enrichment (Prospeo/Expandi).
```

### Export Options:
- **CSV Download:** All leads with all fields
- **PDF Report:** Summary report for stakeholders
- **JSON Export:** Raw data for custom processing

**Status:**
- Basic summary: ✅ MVP Required
- Detailed breakdown: ✅ MVP Required
- PDF export: 📋 Post-MVP Enhancement

---

## Stage 10: Learning Loop - Continuous Improvement

**What happens:** System learns from each search to improve future recommendations and efficiency

### Metrics Tracked Across Searches:

1. **Industry Success Rates:**
   - Track: Which industries have highest email discovery rates
   - Example: "Software companies: 78% email found, Healthcare: 52% email found"
   - Future recommendation: "Note: Healthcare searches typically have lower email availability"

2. **Company Size Patterns:**
   - Track: Which company sizes validate best against ICPs
   - Example: "Companies 50-200 employees have 85% ICP match rate"
   - Future recommendation: "Your ICP performs best with 50-200 employee companies"

3. **API Source Performance:**
   - Track: Which email sources have highest validation rates
   - Example: "Apollo emails: 82% valid, Prospeo emails: 68% valid"
   - Future optimization: Prioritize Apollo over Prospeo

4. **Cost Optimization:**
   - Track: Actual cost vs estimated cost over time
   - Improve cost estimation accuracy
   - Example: "Initial estimate: $25, Actual: $21. Adjusting future estimates."

5. **ICP Pattern Recognition:**
   - Track common ICP prompts and their success
   - Suggest similar ICPs: "Users with similar ICPs found success with..."
   - Auto-tag searches by vertical (fintech, healthcare, etc.)

### Automated Insights (Shown to User):

After search completes, show insights:
```
💡 Insights Based on Your Search:

- Companies in "Financial Services" had 15% lower email discovery
  than your overall average. This is typical for this industry due
  to stricter privacy policies.

- Your ICP scored 64% of companies as 3+ (good fit or better).
  This is above average (typical: 50-55%). Your ICP criteria are
  well-defined.

- 89% of emails from Apollo were valid. This is excellent
  (platform average: 76%).

Recommendations:
✓ Your search performed well. No optimizations needed.
```

### Data Storage for Learning:

```prisma
model SearchInsight {
  id              String   @id @default(uuid())
  searchId        String

  // Patterns discovered
  industryPattern Json     // { "Software": { emailRate: 0.78, validRate: 0.82 } }
  sizePattern     Json     // { "50-200": { icpMatchRate: 0.85 } }

  // Performance metrics
  costEfficiency  Float    // actual cost / estimated cost
  timeEfficiency  Float    // actual time / estimated time

  // Recommendations generated
  recommendations String[]

  createdAt       DateTime @default(now())
}
```

**Status:** 📋 Post-MVP Enhancement (valuable but not critical for first version)

---

## Stage 11: Self-Healing Background - Auto-Recovery

**What happens:** System monitors jobs, auto-retries failures, reconnects dropped sessions

### Monitoring & Auto-Recovery:

1. **Job Timeout Detection:**
   - If job runs longer than expected (2x estimated time) → Flag as stuck
   - Auto-restart stuck jobs
   - Alert user: "Search was stuck, automatically restarted from last checkpoint"

2. **API Connection Monitoring:**
   - If API call fails → Retry with exponential backoff (1s, 2s, 4s)
   - If 3 retries fail → Move to next item, log failure
   - If entire batch fails → Alert user, pause search

3. **Rate Limit Handling:**
   - If rate-limited by API → Auto-pause for required duration
   - Resume automatically when rate limit resets
   - Show user: "Paused for 60 seconds due to API rate limit, resuming automatically..."

4. **Session Reconnection:**
   - If database connection drops → Auto-reconnect
   - If Redis connection drops → Auto-reconnect
   - If repeated failures → Graceful shutdown with error report

5. **Dead Letter Queue:**
   - Failed jobs move to dead letter queue
   - Manual review queue for persistent failures
   - User can see: "3 contacts failed enrichment, view details"

### Health Dashboard (Post-MVP):

Real-time system health monitoring:
- API status: Apollo ✓, DeepSeek ✓, Firecrawl ⚠ (rate limited)
- Worker status: 3 workers active, 0 stuck jobs
- Queue status: 2 jobs running, 5 jobs pending
- Error rate: 2.3% (normal)

**Status:**
- Basic retry logic: ✅ MVP Required
- Advanced monitoring: 📋 Post-MVP Enhancement
- Health dashboard: 📋 Post-MVP Enhancement

---

## Complete Workflow Summary (Visual)

```
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 0: User Input                                             │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Industry: Software, Fintech                                 │ │
│ │ Size: 50-200 employees                                      │ │
│ │ Location: US, UK                                            │ │
│ │ Role: CTO                                                   │ │
│ │ ICP: "B2B SaaS selling to enterprises..."                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 1: Pre-flight Checks                                      │
│ ✓ Apollo API: Healthy                                           │
│ ✓ DeepSeek API: Healthy                                         │
│ ✓ Million Verifier: 5,000 credits available                     │
│ ✓ Database: Connected                                           │
│ ✓ Workers: 3 active                                             │
│ Result: All systems go ✓                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 2: Cost & Time Estimate                                   │
│ Estimated Companies: 500                                        │
│ Estimated Final Leads: 120-150                                  │
│ Estimated Cost: $18-25                                          │
│ Estimated Time: 45-60 min                                       │
│ [User Approves] ✓                                               │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 3: Company Discovery (Phase 1)                            │
│ → Query Apollo: 500 companies found                             │
│ → Save to DB with CHECKPOINT                                    │
│ Progress: 15% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 4: Company Validation (Phase 2)                           │
│ → Scrape 500 websites (Firecrawl)                               │
│ → Validate with DeepSeek AI                                     │
│ → Detect conflicts, resolve                                     │
│ → Filter: 320 validated, 180 rejected                           │
│ → CHECKPOINT after every 50 companies                           │
│ Progress: 45% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 5: Contact Discovery (Phase 3)                            │
│ → Find decision makers at 320 companies                         │
│ → Apollo contacts API: 410 contacts found                       │
│ → De-duplicate, keep top 2 per company                          │
│ → CHECKPOINT saved                                              │
│ Progress: 65% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 6: Email Enrichment (Phase 4)                             │
│ → Enrich 410 contacts with emails                               │
│ → Apollo email API: 285 emails found (70%)                      │
│ → CHECKPOINT every 50 contacts (crash-resistant)                │
│ → 125 contacts without email (marked for fallback)              │
│ Progress: 85% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%        │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 7: Email Validation (Phase 5)                             │
│ → Validate 285 emails (Million Verifier)                        │
│ → Results: 215 valid, 18 risky, 52 invalid                      │
│ → Sample health check: 4/5 pass (80% confidence)                │
│ Progress: 100% ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%       │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 9: Detailed Report Generated                              │
│ ✓ 233 Total Leads (215 valid + 18 risky)                        │
│ ✓ Actual Cost: $20.93                                           │
│ ✓ Actual Time: 47 minutes                                       │
│ ✓ Success Rate: 72.8%                                           │
│ [Download CSV] [View Report] [Export PDF]                       │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ STAGE 10: Insights & Learning                                   │
│ 💡 Your search performed above average!                         │
│ 💡 Email validation rate: 75% (platform avg: 68%)               │
│ 💡 No optimization needed for future searches                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## MVP vs Post-MVP Features

### ✅ MVP (Build First):

- Stage 0: User input form
- Stage 1: Pre-flight API health checks
- Stage 2: Cost & time estimation with approval
- Stage 3: Company discovery with Apollo
- Stage 4: Website scraping + DeepSeek validation (basic conflict resolution)
- Stage 5: Contact discovery with Apollo (no quorum logic)
- Stage 6: Email enrichment with checkpointing
- Stage 7: Email validation with Million Verifier (no sample check)
- Stage 9: Detailed report with cost breakdown

### 📋 Post-MVP (Add Later):

- Stage 4: Advanced conflict resolution UI
- Stage 5: Multi-source quorum validation (Prospeo, Expandi)
- Stage 7: Live sample health check
- Stage 8: Partial re-run capability
- Stage 10: Learning loop and insights
- Stage 11: Advanced monitoring dashboard
- Fallback email enrichment (Prospeo, Expandi)
- BounceBan secondary validation for risky emails
- Alternative contact discovery (backup contacts at same company)
- Saved ICP profiles
- Search history browsing
- PDF report export

---

**Last Updated:** 2026-08-02
**Status:** Workflow Designed with Quality Gates
**Next:** Implement MVP stages 0-7 + 9
