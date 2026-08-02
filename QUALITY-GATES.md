# Quality Gates Framework - Unified Lead Platform

> **11-stage quality gate system ensuring reliable, cost-effective lead generation**
>
> **Adapted from:** Enterprise software deployment best practices
> **Applied to:** Lead generation workflow to prevent failures, waste, and poor results

---

## Purpose of Quality Gates

Each "gate" is a checkpoint that must pass before proceeding. This prevents:
- ❌ Wasting API credits on searches that will fail
- ❌ Delivering poor-quality leads
- ❌ Crashes that lose progress
- ❌ Cost overruns from runaway searches
- ❌ User frustration from unclear status

**Philosophy:** Catch problems early, fail fast, recover gracefully.

---

## Gate 0: Prompt Intake & Structuring

### Purpose
Transform raw user input into structured, executable search plan

### Inputs
- User-entered filters (industry, size, location, role)
- Natural language ICP prompt

### Checks Performed

1. **Input Validation:**
   - ✅ All required fields filled
   - ✅ Industry selection valid (matches Apollo's taxonomy)
   - ✅ Company size range logical (min < max)
   - ✅ Location codes valid
   - ✅ Role description not empty

2. **ICP Prompt Quality:**
   - ✅ Minimum length: 20 characters (prevent lazy "any company" prompts)
   - ✅ Contains specific criteria (check for keywords: "must have", "preferably", "not", etc.)
   - ⚠️ Warning if too vague: "Your ICP is very broad. Consider adding more specific criteria for better results."

3. **Structured Output Generated:**
   - Apollo query parameters formatted
   - DeepSeek validation prompt templated
   - Expected result volume estimated

### Pass Criteria
- All validation checks pass
- User confirms: "Yes, this looks correct"

### Fail Handling
- Show specific error: "Please select at least one industry"
- Prevent proceeding until fixed

### Output
- Structured search configuration stored in database
- User sees confirmation screen before proceeding

**Status:** ✅ MVP Required

---

## Gate 1: Pre-flight Environment Gates

### Purpose
Verify all systems operational BEFORE starting search (prevent doomed searches)

### Checks Performed

#### 1. API Authentication
```typescript
const healthChecks = {
  apollo: await apolloClient.testConnection(),      // ✅ or ❌
  deepseek: await deepseekClient.testConnection(),  // ✅ or ❌
  firecrawl: await firecrawlClient.testConnection(),// ✅ or ❌
  millionVerifier: await mvClient.testConnection(), // ✅ or ❌
};
```

**Pass:** All return 200 OK with valid response
**Fail:** Any return 401 Unauthorized, 403 Forbidden, or timeout

#### 2. Credit Balance Verification
```typescript
const credits = {
  apollo: await apolloClient.getCreditsRemaining(),     // Need: 500+
  firecrawl: await firecrawlClient.getCreditsRemaining(),// Need: 200+
  millionVerifier: await mvClient.getCreditsRemaining(),// Need: 200+
};
```

**Pass:** All services have sufficient credits for estimated search
**Fail:** Any service below required threshold

#### 3. Infrastructure Health
```typescript
const infrastructure = {
  database: await prisma.$queryRaw`SELECT 1`,    // ✅ or ❌
  redis: await redis.ping(),                     // ✅ or ❌
  workers: await getWorkerCount(),               // ≥1 active
};
```

**Pass:** Database connected, Redis responding, at least 1 worker active
**Fail:** Any infrastructure component down

#### 4. Rate Limit Status
```typescript
const rateLimits = {
  apollo: await apolloClient.getRateLimitStatus(),   // Not exhausted
  deepseek: await deepseekClient.getRateLimitStatus(),// Not exhausted
};
```

**Pass:** All APIs within rate limits (not exhausted)
**Fail:** Any API rate-limited or near limit

### Pass Criteria
**ALL checks must pass** (no partial passes)

### Fail Handling

If any check fails:
1. **Do NOT start search**
2. **Show specific error to user:**
   - ❌ "Apollo API authentication failed. Please update API key in settings."
   - ❌ "Insufficient credits: Firecrawl has 50 credits, need 200. Please top up."
   - ❌ "Database connection failed. System maintenance in progress. Try again in 5 minutes."
3. **Log error to monitoring**
4. **Prevent wasted time/credits**

### Output
- ✅ All systems operational → Gate 1 PASSED → Proceed to Gate 2
- ❌ Any system down → Gate 1 FAILED → Halt, show error

**Status:** ✅ MVP Required (Critical reliability feature)

---

## Gate 2: Scope + Plan (Cost & Time Estimation)

### Purpose
Calculate resource requirements and get user approval BEFORE spending credits

### Estimation Logic

#### 1. Volume Estimation
Based on filters, estimate company count:
```typescript
const volumeEstimate = await apolloClient.estimateResultCount({
  industries: search.industry,
  companySize: search.companySize,
  locations: search.location,
});
// Returns: { min: 300, max: 700, avg: 500 }
```

#### 2. Cost Calculation
```typescript
const costs = {
  companyDiscovery: 0.50,  // Fixed: One Apollo bulk query
  scraping: volumeEstimate.avg * 0.02,  // $0.02 per scrape
  deepseekValidation: volumeEstimate.avg * 0.005,  // $0.005 per validation
  contactDiscovery: (volumeEstimate.avg * 0.6) * 0.015,  // 60% validated, $0.015 per
  emailEnrichment: (volumeEstimate.avg * 0.6 * 1.3) * 0.02,  // 1.3 contacts per company, $0.02 per
  emailValidation: (volumeEstimate.avg * 0.6 * 1.3 * 0.7) * 0.005,  // 70% find email, $0.005 per
};

const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);
```

#### 3. Time Estimation
```typescript
const times = {
  companyDiscovery: 2,  // 2 minutes
  scraping: Math.ceil(volumeEstimate.avg / FIRECRAWL_RATE_LIMIT_PER_MIN),  // Based on rate limit
  deepseekValidation: Math.ceil(volumeEstimate.avg / 100) * 1,  // 100 per min, 1 min processing
  contactDiscovery: 5,  // Bulk query, ~5 min
  emailEnrichment: 8,  // Bulk query, ~8 min
  emailValidation: 5,  // Batch upload, ~5 min
};

const totalTime = Object.values(times).reduce((a, b) => a + b, 0);
```

#### 4. Success Rate Estimation
Based on historical data (or defaults for new users):
```typescript
const expectedSuccessRate = {
  companyValidation: 0.60,  // 60% pass ICP validation
  emailDiscovery: 0.70,     // 70% find emails
  emailValidation: 0.75,    // 75% emails valid
  overall: 0.60 * 0.70 * 0.75 = 0.315  // ~31.5% final success rate
};

const expectedLeads = volumeEstimate.avg * expectedSuccessRate.overall;
// 500 companies * 0.315 = 157 final leads
```

### User Approval Screen

```
╔════════════════════════════════════════════════════════╗
║         SEARCH PLAN - APPROVAL REQUIRED                ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  Estimated Companies to Analyze: 500                   ║
║  Estimated Final Leads: 150-160                        ║
║                                                        ║
║  💰 Estimated Cost: $18.75                             ║
║  ⏱️  Estimated Time: 42 minutes                        ║
║  📊 Expected Success Rate: 31%                         ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  COST BREAKDOWN                                        ║
║  ─────────────────────────────────────────────────     ║
║  Company Discovery          $0.50      2 min           ║
║  Website Scraping          $10.00     20 min           ║
║  AI Validation              $2.50      5 min           ║
║  Contact Discovery          $4.50      5 min           ║
║  Email Enrichment           $5.46      8 min           ║
║  Email Validation           $1.64      5 min           ║
║  ─────────────────────────────────────────────────     ║
║  TOTAL                     $18.75     45 min           ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║  CREDIT USAGE                                          ║
║  ─────────────────────────────────────────────────     ║
║  Apollo: ~850 credits (5,240 remaining)                ║
║  Firecrawl: ~500 credits (2,100 remaining)             ║
║  Million Verifier: ~273 credits (4,850 remaining)      ║
║                                                        ║
╠════════════════════════════════════════════════════════╣
║                                                        ║
║  ⚠️  This search will consume credits and cannot be    ║
║     canceled once started. Proceed?                    ║
║                                                        ║
║       [Cancel]              [Start Search]             ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

### Pass Criteria
- User clicks "Start Search"

### Fail Handling
- User clicks "Cancel" → Search not created, no credits spent
- User can modify filters and re-estimate

### Output
- Search record created in database with status = PENDING
- Job queued for background worker
- User sees: "Search #12345 started. Estimated completion: 3:45 PM"

**Status:** ✅ MVP Required (Transparency & cost control)

---

## Gate 3: Isolated Execution (Company Discovery)

### Purpose
Find companies matching criteria in isolated worker (prevents interference with other searches)

### Isolation Mechanism

```typescript
// Each search runs in its own job
const job = await queue.add('company-discovery', {
  searchId: search.id,
  params: search.filters,
});

// Job runs in dedicated worker process
// Cannot interfere with other jobs
// Crash in Job A doesn't affect Job B
```

### Execution Steps

1. **Retrieve Search Configuration:**
   - Load search record from database
   - Parse filters into Apollo query

2. **Execute Apollo Query:**
   ```typescript
   const companies = await apolloClient.searchCompanies({
     industries: search.industry,
     employeeRange: search.companySize,
     locations: search.location,
     limit: 1000,  // Hard limit to prevent runaway searches
   });
   ```

3. **Batch Insert into Database:**
   ```typescript
   // Insert in batches of 100 (prevents long-running transactions)
   for (let i = 0; i < companies.length; i += 100) {
     const batch = companies.slice(i, i + 100);
     await prisma.company.createMany({
       data: batch.map(c => ({
         searchId: search.id,
         name: c.name,
         website: c.website,
         industry: c.industry,
         size: c.employeeCount,
         location: c.location,
         status: 'DISCOVERED',
       })),
     });
   }
   ```

4. **Update Progress:**
   ```typescript
   await prisma.search.update({
     where: { id: search.id },
     data: {
       companiesFound: companies.length,
       currentPhase: 'Company Discovery Complete',
       progressPercent: 15,
     },
   });
   ```

5. **Checkpoint Saved:**
   - All companies in database
   - If crash happens now, we have the company list
   - Can resume from next phase without re-querying Apollo

### Pass Criteria
- Apollo returns ≥1 company
- All companies successfully saved to database

### Fail Handling

**Scenario 1: Apollo API Error**
- Retry 3 times with exponential backoff (1s, 2s, 4s)
- If all retries fail:
  - Mark search as FAILED
  - Error message: "Apollo API unavailable. Please try again later."
  - No credits charged (API call didn't succeed)

**Scenario 2: Zero Results**
- Valid API response but 0 companies match filters
- Mark search as COMPLETED (not failed)
- Show user: "No companies found matching your criteria. Try broadening your filters."
- Minimal credits charged (~$0.50 for API call)

**Scenario 3: Database Error**
- If database insert fails:
  - Retry insert (idempotent, safe to retry)
  - If persistent failure: Mark search as FAILED
  - Log error for investigation

### Output
- ✅ 500 companies saved in database with status = DISCOVERED
- Search.progressPercent = 15%
- Search.currentPhase = "Company Discovery Complete"
- Frontend shows: "✓ Found 500 companies matching criteria"
- Proceed to Gate 4

**Status:** ✅ MVP Required

---

## Gate 4: Mediator + Conflict Detection (Company Validation)

### Purpose
Validate companies against ICP, detect data conflicts, resolve intelligently

### Execution Steps

#### Step 1: Website Scraping (Batch with Rate Limiting)

```typescript
const BATCH_SIZE = 50;
const SCRAPE_RATE_LIMIT = 10; // per minute

for (let i = 0; i < companies.length; i += BATCH_SIZE) {
  const batch = companies.slice(i, i + BATCH_SIZE);

  await Promise.all(
    batch.map(company =>
      rateLimiter.schedule(async () => {
        try {
          const scraped = await firecrawlClient.scrape(company.website, {
            timeout: 30000,  // 30 second timeout
            pages: ['/', '/about', '/products', '/pricing'],  // Multi-page scrape
          });

          // Save immediately (checkpoint)
          await prisma.company.update({
            where: { id: company.id },
            data: {
              scrapedData: scraped,  // JSONB field
            },
          });
        } catch (error) {
          // Don't fail entire search if one website fails
          await prisma.company.update({
            where: { id: company.id },
            data: {
              status: 'SCRAPE_FAILED',
              errorMessage: error.message,
            },
          });
          logger.warn(`Failed to scrape ${company.website}: ${error.message}`);
        }
      })
    )
  );

  // Update progress after each batch
  await updateProgress(search.id, i + BATCH_SIZE, companies.length);
}
```

#### Step 2: AI Validation with DeepSeek

```typescript
for (const company of companiesWithScrapedData) {
  try {
    const validation = await deepseekClient.validate({
      companyName: company.name,
      companyWebsite: company.website,
      scrapedContent: company.scrapedData,
      apolloData: {
        industry: company.industry,
        size: company.size,
        location: company.location,
      },
      icpPrompt: search.icpPrompt,
    });

    // Expected response:
    // {
    //   score: 4,
    //   reasoning: "Strong fit. B2B SaaS in fintech, 120 employees...",
    //   conflicts: ["Apollo says 150 employees, website says 'team of 80'"],
    //   confidence: 0.85
    // }

    await prisma.company.update({
      where: { id: company.id },
      data: {
        score: validation.score,
        scoreReasoning: validation.reasoning,
        status: validation.score >= 2 ? 'VALIDATED' : 'REJECTED',
        conflicts: validation.conflicts || [],
      },
    });
  } catch (error) {
    // Log but continue
    logger.error(`Validation failed for ${company.name}:`, error);
  }
}
```

#### Step 3: Conflict Detection & Resolution

**Conflict Types:**

| Conflict | Apollo Data | Website Data | Auto-Resolution |
|----------|-------------|--------------|-----------------|
| Company Size | 150 employees | "Team of 80" | Trust website (more current) |
| Industry | "Software" | "Healthcare IT SaaS" | Trust website (more specific) |
| Funding Stage | "Series A" | "Bootstrapped since 2020" | Trust website |
| Target Market | "SMB" | "Enterprise-focused" | **Flag for user review** (ICP-critical) |
| Geography | "California" | "Headquarters in Austin" | Trust website |

**Auto-Resolution Logic:**
```typescript
function resolveConflict(conflict) {
  // Rule 1: Trust website for factual data (more current)
  if (conflict.type === 'size' || conflict.type === 'location') {
    return { source: 'website', value: conflict.websiteValue };
  }

  // Rule 2: Trust website for specificity
  if (conflict.type === 'industry' && conflict.websiteValue.includes(conflict.apolloValue)) {
    return { source: 'website', value: conflict.websiteValue };  // More specific
  }

  // Rule 3: Flag ICP-critical conflicts for user review
  if (conflict.icpRelevance === 'high') {
    return { source: 'flag', action: 'USER_REVIEW_REQUIRED' };
  }

  // Default: Trust website
  return { source: 'website', value: conflict.websiteValue };
}
```

**MVP Auto-Resolution:**
- Always trust website data (simpler logic)
- Log conflicts for future review
- Don't block search on conflicts

**Post-MVP Enhancement:**
- Show conflict resolution UI
- User chooses which data source to trust
- User can override AI score

### Pass Criteria
- ≥1 company scored 2+ (validated)
- All companies processed (some may fail scraping, that's OK)

### Fail Handling

**Scenario 1: Scraping Fails for All Companies**
- If 0 out of 500 companies scraped successfully:
  - Firecrawl API likely down
  - Fail entire search
  - Error: "Website scraping service unavailable. Please try again later."
  - Refund credits where possible

**Scenario 2: Scraping Fails for Some Companies**
- If <20% fail: Continue with successful ones
- If 20-50% fail: Continue but warn user
- If >50% fail: Fail search (data quality too poor)

**Scenario 3: All Companies Rejected (Score 1)**
- Valid result, not a failure
- Show user: "0 companies matched your ICP. Your filters may be too narrow or ICP too specific. Try broadening criteria."

### Output
- 320 companies with status = VALIDATED (scores 2-5)
- 180 companies with status = REJECTED (score 1)
- Search.companiesValidated = 320
- Search.progressPercent = 45%
- Proceed to Gate 5

**Status:**
- Basic validation: ✅ MVP Required
- Conflict UI: 📋 Post-MVP

---

## Gate 5: Self-Adversarial Pre-pass + Quorum (Contact Discovery)

### Purpose
Multi-layer validation catches bad data before reaching final results

### Layer 1: Pre-pass Validation (Self-Adversarial)

**Before calling Apollo, validate our own request:**

```typescript
function prePassValidation(search) {
  const issues = [];

  // Check 1: Do validated companies exist?
  const validatedCount = await prisma.company.count({
    where: { searchId: search.id, status: 'VALIDATED' },
  });
  if (validatedCount === 0) {
    issues.push('No validated companies to search contacts for');
  }

  // Check 2: Is target role reasonable?
  const suspiciousRoles = ['CEO', 'Founder', 'Owner'];  // Hard to find emails
  if (suspiciousRoles.includes(search.targetRole)) {
    issues.push(`Warning: ${search.targetRole} emails are often private. Consider targeting VP or Director level.`);
  }

  // Check 3: Rate limit check
  const rateLimitOk = await apolloClient.checkRateLimit();
  if (!rateLimitOk) {
    issues.push('Apollo rate limit reached. Wait 60 seconds before retrying.');
  }

  // Check 4: No duplicate requests
  const duplicateCheck = await checkForDuplicateSearch(search);
  if (duplicateCheck.isDuplicate) {
    issues.push(`Similar search run ${duplicateCheck.hoursAgo} hours ago. Use cached results?`);
  }

  return issues;
}
```

**If issues found:**
- ⚠️ Warnings: Show to user, allow proceeding
- ❌ Errors: Halt search, require user action

### Layer 2: Apollo Contact Discovery

```typescript
const validatedCompanies = await prisma.company.findMany({
  where: { searchId: search.id, status: 'VALIDATED' },
});

for (const company of validatedCompanies) {
  try {
    const contacts = await apolloClient.findContacts({
      companyName: company.name,
      titles: parseTargetRole(search.targetRole),  // "CTO" → ["CTO", "Chief Technology Officer", "VP Engineering"]
      limit: 3,  // Top 3 most senior
    });

    // De-duplication logic
    const deduped = deduplicateContacts(contacts);

    await prisma.contact.createMany({
      data: deduped.map(c => ({
        companyId: company.id,
        name: c.name,
        title: c.title,
        linkedinUrl: c.linkedinUrl,
        status: 'DISCOVERED',
      })),
    });
  } catch (error) {
    // Log and continue
    logger.warn(`Failed to find contacts for ${company.name}:`, error);
  }
}
```

**De-duplication Logic:**
```typescript
function deduplicateContacts(contacts) {
  // If multiple people with same title at same company:
  // Keep top 2 by seniority

  const titlePriority = {
    'CTO': 1,
    'Chief Technology Officer': 1,
    'VP Engineering': 2,
    'VP of Engineering': 2,
    'Head of Engineering': 3,
    'Director of Engineering': 4,
    'Engineering Manager': 5,
  };

  contacts.sort((a, b) => {
    const aPriority = titlePriority[a.title] || 99;
    const bPriority = titlePriority[b.title] || 99;
    return aPriority - bPriority;
  });

  return contacts.slice(0, 2);  // Keep top 2
}
```

### Layer 3: Quorum Validation (Post-MVP)

**Validate contacts from multiple sources:**

```typescript
// Not in MVP, but documented for future
async function quorumValidation(company, targetRole) {
  const sources = await Promise.allSettled([
    apolloClient.findContacts(company, targetRole),
    prospeoClient.findContacts(company, targetRole),
    expandiClient.findContacts(company, targetRole),
  ]);

  const results = sources
    .filter(s => s.status === 'fulfilled')
    .map(s => s.value);

  // If 2+ sources return same person → HIGH CONFIDENCE
  // If sources return different people → FLAG CONFLICT
  // If only 1 source returns data → MEDIUM CONFIDENCE

  return analyzeQuorum(results);
}
```

### Pass Criteria
- ≥1 contact discovered
- Contacts successfully saved to database

### Fail Handling

**Scenario 1: Zero Contacts Found**
- Valid result (some companies don't have public contacts)
- Show user: "Found 320 validated companies but 0 contacts match your target role. Try broadening role criteria."

**Scenario 2: Apollo API Failure**
- Retry logic same as Gate 3
- If persistent failure, fail search

### Output
- 410 contacts saved with status = DISCOVERED
- Search.contactsFound = 410
- Search.progressPercent = 65%
- Proceed to Gate 6

**Status:**
- Layer 1 & 2: ✅ MVP Required
- Layer 3 (Quorum): 📋 Post-MVP

---

## Gate 6: Land - Checkpoint Journaling (Email Enrichment)

### Purpose
Find emails with crash-resistant checkpoint saving (zero data loss on failure)

### Checkpoint Strategy

**Key Innovation:** Save progress every 50 contacts, not at end

```typescript
const contacts = await prisma.contact.findMany({
  where: { companyId: { in: validatedCompanyIds }, status: 'DISCOVERED' },
});

const CHECKPOINT_INTERVAL = 50;

for (let i = 0; i < contacts.length; i++) {
  const contact = contacts[i];

  try {
    // Attempt email enrichment
    const email = await apolloClient.getEmail(contact.id);

    // IMMEDIATE SAVE (not batched)
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        email: email.address,
        emailSource: 'apollo',
        status: 'EMAIL_FOUND',
      },
    });
  } catch (error) {
    // Mark as failed, continue with others
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        status: 'ENRICHMENT_FAILED',
        errorMessage: error.message,
      },
    });
  }

  // Checkpoint every 50 contacts
  if ((i + 1) % CHECKPOINT_INTERVAL === 0) {
    await prisma.search.update({
      where: { id: search.id },
      data: {
        emailsFound: await countEmailsFound(search.id),
        progressPercent: calculateProgress(i + 1, contacts.length, 65, 85),
      },
    });

    // If crash happens here, we resume from contact #51, not #1
    logger.info(`Checkpoint: ${i + 1}/${contacts.length} contacts processed`);
  }
}
```

### Crash Recovery Logic

```typescript
// On worker restart after crash
async function resumeEmailEnrichment(searchId) {
  // Find contacts that need enrichment
  const pendingContacts = await prisma.contact.findMany({
    where: {
      search: { id: searchId },
      status: { in: ['DISCOVERED', 'ENRICHMENT_FAILED'] },  // Not processed or failed
    },
  });

  // Resume from where we left off
  logger.info(`Resuming email enrichment: ${pendingContacts.length} contacts remaining`);
  // Continue with same loop as above
}
```

### Idempotency Guarantee

**Problem:** What if we crash mid-update?
**Solution:** Use upsert pattern (safe to retry)

```typescript
// Safe to call multiple times
await prisma.contact.upsert({
  where: { id: contact.id },
  update: { email, status: 'EMAIL_FOUND' },
  create: { /* would never happen since contact exists */ },
});
```

### Pass Criteria
- ≥1 email found (even if most fail, some success = pass)
- All contacts attempted (processed or marked as failed)

### Fail Handling

**Scenario 1: Worker Crashes Mid-Enrichment**
- On restart: Resume from last checkpoint
- No data loss
- No duplicate API calls (already-enriched contacts skipped)

**Scenario 2: Zero Emails Found**
- Valid result (some industries have low email availability)
- Show user: "0 emails found. This is unusual. Consider:
  - Using fallback enrichment (Prospeo, Expandi)
  - Targeting different roles
  - Checking if industry typically has low email availability"

**Scenario 3: Apollo Rate Limited**
- Pause enrichment
- Wait for rate limit reset
- Auto-resume when available
- Show user: "Paused for 120 seconds due to API rate limit. Resuming automatically..."

### Output
- 285 contacts with email found (status = EMAIL_FOUND)
- 125 contacts with no email (status = ENRICHMENT_FAILED)
- Search.emailsFound = 285
- Search.progressPercent = 85%
- Proceed to Gate 7

**Status:** ✅ MVP Required (Checkpoint logic critical for reliability)

---

## Gate 7: Live Verification + Health Check (Email Validation)

### Purpose
Validate all emails, perform sample quality check

### Email Validation (Million Verifier)

```typescript
// Batch validation (more efficient than individual calls)
const emailsToValidate = await prisma.contact.findMany({
  where: {
    searchId: search.id,
    status: 'EMAIL_FOUND',
    email: { not: null },
  },
  select: { id: true, email: true },
});

// Upload batch to Million Verifier
const batch = await millionVerifierClient.uploadBatch({
  emails: emailsToValidate.map(c => c.email),
  fileName: `search-${search.id}-${Date.now()}.csv`,
});

// Poll for results (batch processing takes 5-10 minutes)
let results;
while (true) {
  results = await millionVerifierClient.getBatchResults(batch.id);
  if (results.status === 'COMPLETED') break;
  await sleep(30000);  // Poll every 30 seconds
  updateProgress(search.id, 'Email Validation', results.progress);
}

// Update database with validation results
for (const result of results.emails) {
  const contact = emailsToValidate.find(c => c.email === result.email);

  await prisma.contact.update({
    where: { id: contact.id },
    data: {
      emailStatus: result.status,  // 'valid', 'invalid', 'risky', 'unknown'
      status: result.status === 'valid' ? 'EMAIL_VALIDATED' : 'EMAIL_INVALID',
    },
  });
}
```

### Categorization Logic

```typescript
const categorized = {
  valid: results.filter(r => r.status === 'valid'),
  risky: results.filter(r => r.status === 'risky'),
  invalid: results.filter(r => r.status === 'invalid'),
  unknown: results.filter(r => r.status === 'unknown'),
};

await prisma.search.update({
  where: { id: search.id },
  data: {
    emailsValid: categorized.valid.length,
    emailsRisky: categorized.risky.length,
    emailsInvalid: categorized.invalid.length,
  },
});
```

### Health Check Sample (Post-MVP)

**Purpose:** Verify validation accuracy with live SMTP check

```typescript
// Post-MVP feature
async function sampleHealthCheck(validatedEmails) {
  // Pick 5 random emails marked 'valid'
  const sample = _.sampleSize(validatedEmails, 5);

  // Perform live SMTP ping (not sending email, just checking mailbox exists)
  const smtpResults = await Promise.all(
    sample.map(email => smtpClient.verify(email.address))
  );

  const passRate = smtpResults.filter(r => r.exists).length / 5;

  // If <60% pass, data may be stale
  if (passRate < 0.6) {
    return {
      confidence: 'LOW',
      message: `Sample check: ${passRate * 100}% of emails valid. Data may be stale. Consider re-running search.`,
    };
  }

  return {
    confidence: passRate >= 0.8 ? 'HIGH' : 'MEDIUM',
    message: `Sample check: ${passRate * 100}% of emails valid. Quality looks good.`,
  };
}
```

### Pass Criteria
- ≥1 valid email (even if most invalid, some success = pass)
- All emails processed through validation

### Fail Handling

**Scenario 1: Million Verifier API Down**
- Retry batch upload 3 times
- If fails: Mark search as partially complete
- User can download results with unvalidated emails
- Option to re-run validation later

**Scenario 2: All Emails Invalid**
- Valid result (rare but possible)
- Show user: "All emails marked invalid. This is highly unusual. Possible causes:
  - Data source (Apollo) has stale data for this industry
  - Target companies use non-standard email formats
  - Consider using fallback enrichment sources"

**Scenario 3: Low Sample Health Check Pass Rate**
- Don't fail search
- Show warning: "⚠️ Sample health check indicates 40% of emails may be invalid. Proceed with caution."
- User decides whether to accept results or re-run

### Output
- 215 valid emails
- 18 risky emails (included with warning flag)
- 52 invalid emails (excluded from final results)
- Search.progressPercent = 100%
- Search.status = COMPLETED
- Proceed to Gate 9 (report generation)

**Status:**
- Email validation: ✅ MVP Required
- Sample health check: 📋 Post-MVP

---

## Gate 8: Rollback / Partial Re-run (Future Feature)

### Purpose
Enable re-running failed portions without re-processing entire search

**Status:** 📋 Post-MVP (Documented for future, not in MVP)

### Use Cases

1. **User Reports Bad Data:**
   - "These 20 companies don't match my ICP"
   - Re-run Phase 2 (validation) for those 20 only
   - Use cached scraped data (don't re-scrape)

2. **API Failure Mid-Search:**
   - Million Verifier was down
   - 100 emails never validated
   - Re-run Phase 5 for just those 100 emails

3. **ICP Criteria Changed:**
   - "Actually, exclude companies under 100 employees"
   - Re-run Phase 2 with new criteria
   - Don't re-discover companies or scrape websites

### Implementation Plan

```typescript
// Post-MVP
async function rerunPhase(searchId, phase, options) {
  switch (phase) {
    case 'VALIDATION':
      // Re-validate companies with new ICP prompt
      return revalidateCompanies(searchId, options.companyIds, options.newIcpPrompt);

    case 'EMAIL_ENRICHMENT':
      // Re-enrich contacts that failed first time
      return reenrichEmails(searchId, options.contactIds);

    case 'EMAIL_VALIDATION':
      // Re-validate emails (maybe use different service)
      return revalidateEmails(searchId, options.contactIds);

    default:
      throw new Error(`Phase ${phase} does not support re-runs`);
  }
}
```

### Database Support

**Each entity tracks which phase it's in:**
```prisma
model Company {
  lastProcessedPhase String?  // "VALIDATED", "REJECTED", etc.
  processedAt DateTime?
}

model Contact {
  lastProcessedPhase String?  // "EMAIL_FOUND", "EMAIL_VALIDATED", etc.
  processedAt DateTime?
}
```

This enables:
- Query: "Which companies were rejected in validation?"
- Query: "Which contacts failed email enrichment?"
- Re-run just those records

---

## Gate 9: Report - Detailed Search Receipt

### Purpose
Generate comprehensive report showing exactly what happened

### Report Components

#### 1. Summary Stats

```typescript
const summary = {
  searchId: search.id,
  completedAt: search.completedAt,
  duration: search.completedAt - search.createdAt,  // milliseconds

  companies: {
    found: search.companiesFound,
    validated: search.companiesValidated,
    rejected: search.companiesFound - search.companiesValidated,
    validationRate: search.companiesValidated / search.companiesFound,
  },

  contacts: {
    found: search.contactsFound,
    avgPerCompany: search.contactsFound / search.companiesValidated,
  },

  emails: {
    found: search.emailsFound,
    valid: search.emailsValid,
    risky: search.emailsRisky || 0,
    invalid: search.emailsInvalid || 0,
    validationRate: search.emailsValid / search.emailsFound,
  },

  finalLeads: search.emailsValid + (search.emailsRisky || 0),
  overallSuccessRate: (search.emailsValid + search.emailsRisky) / search.companiesFound,
};
```

#### 2. Cost Breakdown

```typescript
const costBreakdown = {
  phases: [
    { name: 'Company Discovery', cost: 0.50, duration: '2 min', status: 'SUCCESS' },
    { name: 'Website Scraping', cost: 10.00, duration: '20 min', status: 'SUCCESS' },
    { name: 'AI Validation', cost: 2.50, duration: '5 min', status: 'SUCCESS' },
    { name: 'Contact Discovery', cost: 4.50, duration: '7 min', status: 'SUCCESS' },
    { name: 'Email Enrichment', cost: 5.70, duration: '9 min', status: 'SUCCESS' },
    { name: 'Email Validation', cost: 1.43, duration: '5 min', status: 'SUCCESS' },
  ],
  total: 24.63,
  estimated: 22.50,
  variance: +2.13,  // Came in slightly over estimate
};
```

#### 3. Quality Metrics

```typescript
const quality = {
  emailValidationPassRate: 0.754,  // 75.4%
  companyToLeadConversion: 0.466,  // 46.6% (excellent)
  avgIcpScore: 3.8,  // Average score of validated companies
  dataFreshness: 'All sources accessed within last 24 hours',
};
```

#### 4. Failure Analysis

```typescript
const failures = {
  companies: {
    scrapeFailed: 12,  // Couldn't scrape website
    rejectedByIcp: 180,  // Scored 1/5
  },
  contacts: {
    apolloNoData: 5,  // Apollo had no contacts for these companies
  },
  emails: {
    notFound: 125,  // Couldn't find email
    invalid: 52,  // Found but invalid
  },
};
```

### Report Formats

1. **JSON (for API/programmatic access):**
   ```json
   {
     "searchId": "abc123",
     "summary": { ... },
     "costBreakdown": { ... },
     "quality": { ... },
     "failures": { ... }
   }
   ```

2. **CSV (for lead export):**
   ```
   Company,Score,Website,Name,Title,Email,EmailStatus,LinkedIn
   Acme Corp,4,acme.com,John Doe,CTO,john@acme.com,valid,linkedin.com/in/johndoe
   ...
   ```

3. **PDF (for stakeholders) - Post-MVP:**
   Formatted professional report with charts

### Pass Criteria
- Report successfully generated
- All data present and formatted correctly

### Fail Handling
- If report generation fails (rare), user can still access data via database
- Retry report generation

### Output
- Detailed report available for download
- User sees summary in UI
- Can export leads as CSV

**Status:**
- JSON summary: ✅ MVP Required
- CSV export: ✅ MVP Required
- PDF report: 📋 Post-MVP

---

## Gate 10: Learning Loop (Continuous Improvement)

### Purpose
System learns from each search to improve future recommendations

**Status:** 📋 Post-MVP (Documented, not in MVP)

### Metrics Tracked

```prisma
model SearchInsight {
  id                String   @id @default(uuid())
  searchId          String

  // Industry-specific patterns
  industryPatterns  Json
  // Example: { "Software": { emailDiscoveryRate: 0.78, validationRate: 0.82 } }

  // Company size patterns
  sizePatterns      Json
  // Example: { "50-200": { icpMatchRate: 0.85, emailAvailability: 0.72 } }

  // API performance
  apiPerformance    Json
  // Example: { "apollo": { emailSuccessRate: 0.70 }, "prospeo": { emailSuccessRate: 0.65 } }

  // Cost efficiency
  costEfficiency    Float   // actual / estimated (1.0 = perfect estimate)
  timeEfficiency    Float   // actual / estimated

  // User-specific patterns
  userId            String?
  userIcpPatterns   Json?   // This user's typical ICP criteria

  createdAt         DateTime @default(now())
}
```

### Learning Algorithms (Future)

1. **Industry Success Rates:**
   ```typescript
   // After each search, update industry metrics
   const industryInsights = await calculateIndustryInsights(search);
   // "Software companies: 78% email discovery rate (above platform avg of 68%)"
   ```

2. **ICP Pattern Recognition:**
   ```typescript
   // Detect common ICP patterns
   const icpClusters = await clusterSimilarIcps(allSearches);
   // "Users with similar ICPs found success with..."
   ```

3. **Cost Optimization:**
   ```typescript
   // Learn which API sources are most cost-effective per industry
   const costOptimization = await analyzeApiCostEfficiency(searches);
   // "For fintech companies, Prospeo has 15% lower cost per valid email than Apollo"
   ```

### User-Facing Insights (Post-MVP)

After search completes, show:
```
💡 Insights for Your Search:

- Email discovery rate: 70% (platform avg: 68%) ✓
- ICP validation rate: 64% (above avg for Software industry)
- Cost efficiency: Came in 5% over estimate due to higher company count than expected

Recommendations:
✓ Your search performed well. No optimizations needed.
📊 Consider narrowing company size filter to 100-200 (better ICP match rate in past searches)
```

---

## Gate 11: Self-Healing Background (Auto-Recovery)

### Purpose
Monitor jobs, auto-retry failures, prevent stuck searches

**Status:** Partial in MVP (basic retry), Full in Post-MVP

### Monitoring & Recovery

#### 1. Job Timeout Detection

```typescript
// Background watcher process
setInterval(async () => {
  const stuckJobs = await prisma.search.findMany({
    where: {
      status: 'RUNNING',
      updatedAt: { lt: new Date(Date.now() - 2 * 60 * 60 * 1000) },  // No update in 2 hours
    },
  });

  for (const job of stuckJobs) {
    logger.error(`Job ${job.id} stuck, restarting`);

    // Mark as failed, will be auto-retried
    await prisma.search.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMessage: 'Job timeout - auto-restarting' },
    });

    // Queue for retry
    await queue.add('restart-search', { searchId: job.id });
  }
}, 5 * 60 * 1000);  // Check every 5 minutes
```

#### 2. API Connection Monitoring

```typescript
async function executeWithAutoReconnect(apiCall) {
  try {
    return await apiCall();
  } catch (error) {
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      // Network error, retry
      await sleep(2000);
      return await apiCall();  // Retry once
    }

    // Check if rate limited
    if (error.status === 429) {
      const retryAfter = error.headers['retry-after'] || 60;
      logger.info(`Rate limited, pausing for ${retryAfter} seconds`);
      await sleep(retryAfter * 1000);
      return await apiCall();  // Retry after waiting
    }

    // Unrecoverable error
    throw error;
  }
}
```

#### 3. Database Connection Auto-Reconnect

```typescript
// Prisma handles this automatically, but we can add explicit checks
prisma.$on('error', (e) => {
  logger.error('Database connection error:', e);
  // Prisma will auto-reconnect, but we log for monitoring
});
```

#### 4. Dead Letter Queue

```typescript
// Jobs that fail >3 times go to dead letter queue
queue.on('failed', async (job, error) => {
  if (job.attemptsMade >= 3) {
    await prisma.deadLetterJob.create({
      data: {
        searchId: job.data.searchId,
        jobType: job.name,
        errorMessage: error.message,
        jobData: job.data,
      },
    });

    // Alert admin
    await sendAlert({
      type: 'PERSISTENT_JOB_FAILURE',
      jobId: job.id,
      error: error.message,
    });
  }
});
```

### Health Dashboard (Post-MVP)

```
System Health - Real-time
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
APIs:
  ✅ Apollo          Healthy (95ms avg response time)
  ✅ DeepSeek        Healthy (320ms avg response time)
  ⚠️  Firecrawl       Degraded (rate limited, 45 min wait)
  ✅ Million Verifier Healthy

Workers:
  ✅ 3 workers active
  📊 5 jobs in queue
  ⏱️  Avg processing time: 42 minutes

Database:
  ✅ Connected (12ms query time)
  📊 Database size: 1.2 GB / 8 GB (15% used)

Error Rate:
  📊 2.3% (normal range)
  ✅ No critical errors in last 24 hours
```

**Status:**
- Basic retry: ✅ MVP
- Timeout detection: ✅ MVP
- Health dashboard: 📋 Post-MVP

---

## Summary: Quality Gate Enforcement

| Gate | Purpose | MVP Status | Pass Criteria |
|------|---------|-----------|---------------|
| 0: Prompt Intake | Structure user input | ✅ Required | Valid filters + ICP prompt |
| 1: Pre-flight | Verify systems healthy | ✅ Required | All APIs + infra operational |
| 2: Scope + Plan | Cost/time estimate | ✅ Required | User approves estimate |
| 3: Isolated Execution | Find companies | ✅ Required | ≥1 company found |
| 4: Conflict Detection | Validate companies | ✅ Required | ≥1 company validated |
| 5: Quorum | Find contacts | ✅ Required | ≥1 contact found |
| 6: Checkpoint Journaling | Enrich emails | ✅ Required | ≥1 email found |
| 7: Live Verification | Validate emails | ✅ Required | ≥1 valid email |
| 8: Rollback | Re-run portions | 📋 Post-MVP | N/A |
| 9: Report | Detailed report | ✅ Required | Report generated |
| 10: Learning Loop | Continuous improvement | 📋 Post-MVP | N/A |
| 11: Self-Healing | Auto-recovery | Partial MVP | Jobs don't get stuck |

---

**Last Updated:** 2026-08-02
**Status:** Quality gates framework defined
**Next:** Implement gates in MVP workflow
