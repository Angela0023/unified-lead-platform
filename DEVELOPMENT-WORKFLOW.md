# Development Workflow - Unified Lead Platform

> **Safe development and deployment practices to prevent breaking changes**
>
> **Guiding Principle:** "One tiny change shouldn't break the whole app"

---

## The Problem We're Solving

**Angela's Top Concern:**
> "I've had experiences where I make one tiny change in one section, and the whole app gets fucked up. Everything goes blank. I need to fix so many things. Users cannot use the app."

**Root Causes:**
1. No isolation between features
2. Shared state causing cascading failures
3. No testing before deployment
4. No rollback mechanism
5. Changes deployed directly to production

**Our Solution:** Adopt a development workflow with quality gates (inspired by the framework from the screenshots)

---

## Core Principles

### 1. Modular Architecture (Isolation)
**Rule:** Each feature/integration lives in its own folder and cannot directly access others

```
/src
  /integrations
    /apollo       ← Changes here don't touch DeepSeek
    /deepseek     ← Changes here don't touch Apollo
    /firecrawl
    /million-verifier
```

**Example:**
```typescript
// ❌ BAD: Direct coupling
import { apolloClient } from '../apollo/client';
import { deepseekClient } from '../deepseek/client';

function processCompany() {
  apolloClient.search();
  deepseekClient.validate();  // Now Apollo and DeepSeek are coupled
}

// ✅ GOOD: Dependency injection
function processCompany(searchClient, validationClient) {
  searchClient.search();
  validationClient.validate();  // Can swap implementations
}
```

### 2. Git Branching Strategy
**Rule:** Never commit directly to `main`. Always use feature branches.

```
main                    ← Production code (always working)
  │
  ├─ dev                ← Integration branch (tested features)
  │   │
  │   ├─ feature/search-form
  │   ├─ feature/apollo-integration
  │   └─ feature/progress-tracking
```

**Workflow:**
1. Create feature branch: `git checkout -b feature/search-form`
2. Make changes in branch
3. Test locally
4. Push to GitHub
5. Create Pull Request (PR)
6. Review changes
7. Merge to `dev`
8. Test in staging
9. Merge `dev` to `main` when stable

### 3. Testing Before Deployment
**Rule:** Every change must pass tests before merging

**MVP:** Manual testing checklist
**Post-MVP:** Automated tests

**Manual Testing Checklist:**
- [ ] Feature works in isolation
- [ ] Feature works in full workflow
- [ ] No console errors
- [ ] No broken UI
- [ ] Database queries work
- [ ] API calls succeed

### 4. Deployment Strategy
**Rule:** Deploy to staging first, test, then production

```
Code Change → Local Testing → Push to GitHub → Deploy to Staging → Test in Staging → Deploy to Production
```

**Environments:**
- **Local:** Your machine (localhost)
- **Staging:** Vercel preview deployment (automatic for each PR)
- **Production:** Main Vercel deployment (main branch)

---

## Detailed Workflow: Making a Change

### Step 1: Create Feature Branch

```bash
# Make sure you're on main and up-to-date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/add-progress-bar

# Naming convention:
# - feature/[name] for new features
# - fix/[name] for bug fixes
# - refactor/[name] for refactoring
```

### Step 2: Make Changes (With Guardrails)

**Before touching code, ask:**
1. Which file(s) need to change?
2. Will this affect other features?
3. Is there a way to isolate the change?

**Example: Adding a Progress Bar**

```
Files to change:
- /src/app/search/[id]/page.tsx (add progress bar component)
- /src/components/ProgressBar.tsx (new file)

Files NOT to change:
- /src/integrations/apollo/client.ts (unrelated)
- /src/app/api/searches/route.ts (unrelated)
```

**Principle:** Change the minimum number of files necessary

### Step 3: Test Locally

```bash
# Run development server
npm run dev

# Open http://localhost:3000
# Test the feature manually

# Check for errors in console
# Check that nothing else broke
```

**Testing Checklist:**
- [ ] Feature works as intended
- [ ] Other features still work (smoke test)
- [ ] No console errors
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code formatted (`npm run format`)

### Step 4: Commit Changes

```bash
# Stage changes
git add src/app/search/[id]/page.tsx
git add src/components/ProgressBar.tsx

# Commit with clear message
git commit -m "Add real-time progress bar to search results page

- Created ProgressBar component with animated percentage
- Integrated with search status API
- Shows current phase and estimated completion time
- Tested with 3 sample searches, works correctly

Addresses: Better UX for long-running searches
No breaking changes
"

# Note the commit message format:
# 1. Short summary (what changed)
# 2. Blank line
# 3. Details (how it works, what was tested)
# 4. Context (why we made the change)
```

### Step 5: Push to GitHub

```bash
# Push feature branch to GitHub
git push origin feature/add-progress-bar
```

This automatically:
- Creates a Vercel preview deployment
- Runs any CI checks (if configured)
- Makes it available for review

### Step 6: Test in Staging (Vercel Preview)

Vercel automatically deploys every branch to a preview URL:
```
https://unified-lead-platform-abc123.vercel.app
```

**Test in staging:**
1. Open preview URL
2. Test feature again (in production-like environment)
3. Check that environment variables work
4. Check that database connection works

### Step 7: Create Pull Request (PR)

On GitHub:
1. Go to repository
2. Click "New Pull Request"
3. Base: `main`, Compare: `feature/add-progress-bar`
4. Write PR description:

```markdown
## Summary
Added real-time progress bar to search results page

## Changes
- New `ProgressBar` component
- Updated search page to poll for status every 5s
- Shows current phase, percentage, and estimated completion

## Testing
- [x] Tested locally with 3 searches
- [x] Tested in Vercel preview
- [x] No breaking changes
- [x] TypeScript passes
- [x] No console errors

## Screenshots
[Attach screenshot of progress bar]

## Breaking Changes
None

## Deployment Notes
No special deployment steps needed
```

5. Request review (if team member available) or self-review
6. Merge when ready

### Step 8: Deploy to Production

```bash
# After PR merged to main, pull latest
git checkout main
git pull origin main
```

Vercel automatically deploys `main` branch to production.

**Verify production:**
1. Visit production URL
2. Test feature one more time
3. Monitor for errors (Vercel logs)

---

## Rollback Procedure

**If something breaks in production:**

### Option 1: Quick Rollback (Revert Commit)

```bash
# Find the commit that broke things
git log

# Revert the problematic commit
git revert abc123

# Push to main
git push origin main
```

Vercel auto-deploys the revert, restoring previous working state.

### Option 2: Rollback to Previous Deployment (Vercel)

1. Go to Vercel dashboard
2. Find previous working deployment
3. Click "Promote to Production"
4. Previous version is now live again

### Option 3: Fix Forward

```bash
# Create hotfix branch
git checkout -b hotfix/fix-broken-feature

# Make fix
# Test locally
# Push and deploy quickly

git push origin hotfix/fix-broken-feature
# Create PR, merge immediately
```

---

## Database Changes (Migrations)

**CRITICAL:** Database changes need extra care to avoid breaking the app

### Safe Migration Workflow

**Step 1: Make Schema Change**

```prisma
// prisma/schema.prisma

model Search {
  id        String   @id @default(uuid())
  // ... existing fields ...

  // NEW FIELD (safe to add)
  estimatedCost Float?  @default(0)
}
```

**Step 2: Create Migration**

```bash
# Create migration file
npx prisma migrate dev --name add_estimated_cost

# This creates:
# prisma/migrations/20260802_add_estimated_cost/migration.sql
```

**Step 3: Review Migration SQL**

```sql
-- migration.sql
ALTER TABLE "Search" ADD COLUMN "estimatedCost" DOUBLE PRECISION DEFAULT 0;
```

**Check:**
- ✅ Is this reversible?
- ✅ Does it have a default value? (so existing records don't break)
- ✅ Is the column nullable or has default? (required!)

**Step 4: Test Locally**

```bash
# Apply migration
npx prisma migrate dev

# Test app with new schema
npm run dev

# Verify existing data still works
```

**Step 5: Deploy**

```bash
# Commit migration files
git add prisma/schema.prisma
git add prisma/migrations/

git commit -m "Add estimatedCost field to Search model

- New optional field to track cost estimates
- Default value: 0
- Safe migration: existing records unaffected
"

# Push and deploy
git push origin feature/add-cost-tracking
```

**Production deployment automatically runs migrations via:**
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

### Dangerous Migrations (Avoid!)

**❌ DON'T:**
- Remove columns without checking if they're used
- Rename columns (breaks old code)
- Change column types (can cause data loss)
- Add non-nullable columns without default

**✅ DO:**
- Add columns with default values
- Add optional columns (nullable)
- Add new tables (safe)
- Add indexes (safe, improves performance)

### Rollback a Migration

```bash
# Undo last migration (local only, BEFORE deploying)
npx prisma migrate reset

# If already deployed, create new migration to revert
# Example: Remove column
npx prisma migrate dev --name remove_estimated_cost
```

---

## Code Review Checklist

**Before merging any PR, check:**

### Functionality
- [ ] Feature works as described
- [ ] No console errors
- [ ] No broken UI elements
- [ ] Handles edge cases (empty states, errors)

### Code Quality
- [ ] TypeScript types used (no `any`)
- [ ] Functions have clear names
- [ ] Complex logic has comments
- [ ] No unused imports or variables

### Integration
- [ ] Doesn't break existing features
- [ ] API clients properly isolated
- [ ] Database queries optimized
- [ ] No hardcoded values (use env vars)

### Security
- [ ] No API keys in code
- [ ] User input validated
- [ ] No SQL injection risks
- [ ] No XSS vulnerabilities

### Performance
- [ ] No unnecessary API calls
- [ ] Database queries use indexes
- [ ] Large lists are paginated
- [ ] Images optimized

### Testing
- [ ] Tested locally
- [ ] Tested in staging
- [ ] Manual test checklist completed
- [ ] Breaking changes documented

---

## Monitoring After Deployment

**After deploying to production:**

### Check Vercel Logs
1. Go to Vercel dashboard
2. Select deployment
3. View "Functions" tab (for errors)
4. View "Runtime Logs"

### Check Database
1. Supabase dashboard
2. Check table row counts (did migration work?)
3. Check for errors in logs

### User Testing
1. Run a real search
2. Verify all phases complete
3. Check final results

**If errors occur:**
- Check logs immediately
- If critical: Rollback using revert or Vercel rollback
- If minor: Create hotfix branch

---

## Version Tagging

**After successful deployment, tag the version:**

```bash
# Tag the release
git tag -a v0.2.0 -m "MVP: Search form and Apollo integration"

# Push tag
git push origin v0.2.0
```

**Version numbering:**
- `v0.1.0` - Planning complete
- `v0.2.0` - Search form implemented
- `v0.3.0` - Background workflow complete
- `v1.0.0` - MVP complete, production-ready
- `v1.1.0` - New feature added
- `v2.0.0` - Breaking change (e.g., multi-user support)

---

## Emergency Contacts & Resources

### If Something Breaks in Production

1. **Rollback immediately** (Vercel dashboard or `git revert`)
2. **Check logs** (Vercel functions tab)
3. **Notify Angela** (if she's using the app)
4. **Create hotfix branch** to fix properly
5. **Document incident** in DECISIONS.md (what broke, why, how fixed)

### Useful Commands

```bash
# Check current branch
git branch

# See uncommitted changes
git status

# Undo local changes (before commit)
git checkout -- filename.ts

# View commit history
git log --oneline

# Check TypeScript errors
npm run type-check

# Format code
npm run format

# View Prisma schema
npx prisma studio
```

---

## Summary: The Safe Change Process

```
1. Create feature branch
   └─ git checkout -b feature/my-change

2. Make minimal changes
   └─ Only touch files that need changing

3. Test locally
   └─ npm run dev, manual testing

4. Commit with clear message
   └─ git commit -m "Clear description"

5. Push to GitHub
   └─ git push origin feature/my-change

6. Test in Vercel preview
   └─ Verify in production-like environment

7. Create Pull Request
   └─ Document changes, testing, breaking changes

8. Merge to main
   └─ Vercel auto-deploys to production

9. Monitor production
   └─ Check logs, test feature live

10. If breaks: Rollback
    └─ git revert or Vercel rollback

11. Document lesson
    └─ Add to DECISIONS.md
```

**Key Principle:** Every step has a safety check. Nothing goes to production without verification.

---

**Last Updated:** 2026-08-02
**Status:** Development workflow defined
**Next:** Follow this process for every change
