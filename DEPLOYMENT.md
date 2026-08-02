# Deployment Guide - Unified Lead Platform

> **Complete guide for deploying to production**
>
> **Timeline:** Sprint 14 (after MVP development complete)

---

## Overview

This guide covers deploying the Unified Lead Platform to production using:
- **Vercel** - Frontend + API Routes
- **Supabase** - PostgreSQL Database
- **Railway** - Redis + Background Workers
- **Cloudflare DNS** - Custom domain (leads.corsyx.com)

---

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] MVP development complete (Sprints 1-13 done)
- [ ] All code pushed to GitHub (`Angela0023/unified-lead-platform`)
- [ ] API keys obtained (see API Keys section below)
- [ ] Vercel account created
- [ ] Supabase account created
- [ ] Railway account created
- [ ] Domain available (corsyx.com via Cloudflare)

---

## Part 1: API Keys Setup

### 1.1 Apollo API Key

**What it does:** Company search, contact discovery, email enrichment (primary source)

**How to get:**
1. Go to https://app.apollo.io
2. Log in to your account
3. Click profile icon (top right) → Settings
4. Navigate to API → API Keys
5. Click "Create New Key"
6. Name: "Unified Lead Platform"
7. Copy the key (starts with `pk_...`)

**Cost:** Based on your existing subscription

**MVP Status:** ✅ Required for MVP

---

### 1.2 DeepSeek API Key

**What it does:** AI company validation (scores companies 1-5 against ICP)

**How to get:**
1. Go to https://platform.deepseek.com
2. Sign up or log in
3. Navigate to API Keys
4. Click "Create API Key"
5. Name: "Unified Lead Platform"
6. Copy the key (starts with `sk-...`)

**Cost:** ~$0.005 per validation (very cheap)

**MVP Status:** ✅ Required for MVP

---

### 1.3 Firecrawl API Key

**What it does:** Website scraping for company validation

**How to get:**
1. Go to https://www.firecrawl.dev
2. Sign up or log in
3. Dashboard → API Keys
4. Copy your API key

**Alternative (if Firecrawl unavailable):**
- Use basic web scraping (less reliable)
- Document this in code comments

**Cost:** Free tier: 500 scrapes/month, then ~$0.01-0.02 per scrape

**MVP Status:** ✅ Required for MVP

---

### 1.4 Million Verifier API Key

**What it does:** Email validation (valid/invalid/risky)

**How to get:**
1. Go to https://www.millionverifier.com
2. Log in to your account
3. Navigate to API
4. Copy your API key

**Cost:** Based on your existing subscription

**MVP Status:** ✅ Required for MVP

---

### 1.5 Prospeo API Key (Post-MVP)

**What it does:** Fallback email enrichment when Apollo fails

**How to get:**
1. Go to https://prospeo.io
2. Sign up or log in
3. Dashboard → API
4. Copy your API key

**Cost:** Based on subscription plan

**MVP Status:** 📋 Post-MVP (v1.1.0) - Get key now but enable later

---

### 1.6 Expandi API Key (Post-MVP)

**What it does:** Second fallback email enrichment

**How to get:**
1. Go to https://expandi.io
2. Log in to your account
3. Settings → API
4. Generate API key
5. Copy the key

**Cost:** Based on subscription plan

**MVP Status:** 📋 Post-MVP (v1.1.0) - Get key now but enable later

---

### 1.7 BounceBan API Key (Post-MVP)

**What it does:** Secondary validation for "risky" emails from Million Verifier

**How to get:**
1. Go to https://www.bounceban.com
2. Sign up or log in
3. API Settings
4. Generate API key
5. Copy the key

**Cost:** Based on verification volume

**MVP Status:** 📋 Post-MVP (v1.1.0) - Get key now but enable later

---

## Part 2: Vercel Deployment

### 2.1 Sign Up for Vercel

1. Go to https://vercel.com
2. Click "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access Angela0023 account
5. Complete sign-up

**Cost:** Free (Hobby plan - sufficient for MVP)

---

### 2.2 Import Project

1. After login, click "Add New" → "Project"
2. Find: `Angela0023/unified-lead-platform`
3. Click "Import"

**Vercel auto-detects Next.js:**
```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Root Directory: ./
```

4. Click "Deploy" (will fail first time - missing env vars)

---

### 2.3 Add Environment Variables

After first deployment (even if it fails):

1. Go to Project Settings
2. Click "Environment Variables" (left sidebar)
3. Click "Production" environment
4. Click "Add Environment Variable"

**Add these variables one by one:**

#### Infrastructure Variables (Add Later When Services Set Up)

```bash
# Database (add after Supabase setup - Part 3)
DATABASE_URL
Value: postgresql://postgres:[password]@[host].supabase.co:5432/postgres

# Redis (add after Railway setup - Part 4)
REDIS_URL
Value: redis://default:[password]@[host].railway.app:6379
```

#### API Keys (Add Now)

```bash
# Required for MVP
APOLLO_API_KEY
Value: [your-apollo-key-from-1.1]

DEEPSEEK_API_KEY
Value: [your-deepseek-key-from-1.2]

FIRECRAWL_API_KEY
Value: [your-firecrawl-key-from-1.3]

MILLION_VERIFIER_API_KEY
Value: [your-million-verifier-key-from-1.4]

# Post-MVP (add keys now, enable later in code)
PROSPEO_API_KEY
Value: [your-prospeo-key-from-1.5]

EXPANDI_API_KEY
Value: [your-expandi-key-from-1.6]

BOUNCEBAN_API_KEY
Value: [your-bounceban-key-from-1.7]

# App Configuration
NEXT_PUBLIC_APP_URL
Value: https://unified-lead-platform.vercel.app
(update to custom domain later: https://leads.corsyx.com)
```

**For each variable:**
1. Enter Name (e.g., `APOLLO_API_KEY`)
2. Enter Value (paste the API key)
3. Check "Production" environment
4. Click "Add"

---

### 2.4 Redeploy After Adding Variables

1. Go to "Deployments" tab
2. Find latest deployment
3. Click "..." menu → "Redeploy"
4. Wait for deployment to complete

**Check deployment:**
- Visit: https://unified-lead-platform.vercel.app
- Should see landing page
- Test a search (will fail if DB/Redis not set up yet)

---

## Part 3: Supabase Database Setup

### 3.1 Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub (Angela0023)
4. Create organization: "Angela Petkovska" or "Dopamine Digital"

**Cost:** Free tier (500MB storage - sufficient for MVP)

---

### 3.2 Create Database

1. Click "New Project"
2. Project name: `unified-lead-platform`
3. Database password: Generate strong password (save securely!)
4. Region: Choose closest to users (e.g., US East, EU West)
5. Pricing plan: Free
6. Click "Create new project"

**Wait 2-3 minutes** for database provisioning.

---

### 3.3 Get Database URL

1. Project created → Go to Settings (left sidebar)
2. Click "Database"
3. Scroll to "Connection string"
4. Choose "URI" tab
5. Copy the connection string (replace `[YOUR-PASSWORD]` with your password)

**Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
```

**Example:**
```
postgresql://postgres:MySecurePass123@db.abc123xyz.supabase.co:5432/postgres
```

---

### 3.4 Run Migrations on Supabase

**Option A: Via Prisma (Recommended)**

On your local machine:

```bash
# Update .env with Supabase URL
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Verify
npx prisma studio
# Should see Search, Company, Contact, Job tables
```

**Option B: Via Supabase Dashboard**

1. Go to SQL Editor (left sidebar)
2. New query
3. Paste migration SQL from `prisma/migrations/[migration-folder]/migration.sql`
4. Run query

---

### 3.5 Add DATABASE_URL to Vercel

1. Go back to Vercel project
2. Settings → Environment Variables
3. Find `DATABASE_URL` (or add if not present)
4. Paste Supabase connection string
5. Check "Production" environment
6. Save

**Redeploy Vercel** (Deployments → Redeploy)

---

## Part 4: Railway Redis + Workers Setup

### 4.1 Create Railway Account

1. Go to https://railway.app
2. Click "Login"
3. Choose "Login with GitHub"
4. Authorize Railway (Angela0023)

**Cost:** Free tier ($5 credit/month - sufficient for MVP)

---

### 4.2 Create Redis Service

1. Click "New Project"
2. Click "Deploy from Template"
3. Search "Redis"
4. Click "Redis" template
5. Click "Deploy"

**Wait 1-2 minutes** for Redis deployment.

---

### 4.3 Get Redis URL

1. Redis service created → Click on it
2. Go to "Variables" tab
3. Find `REDIS_URL` or `REDIS_PRIVATE_URL`
4. Copy the value

**Format:**
```
redis://default:[password]@[host].railway.app:6379
```

---

### 4.4 Create Worker Service

1. In same Railway project, click "New Service"
2. Choose "GitHub Repo"
3. Select `Angela0023/unified-lead-platform`
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm run worker`
   - **Root Directory:** `/`

5. Add environment variables (Variables tab):
   ```
   DATABASE_URL = [same as Supabase URL]
   REDIS_URL = [from step 4.3]
   APOLLO_API_KEY = [your key]
   DEEPSEEK_API_KEY = [your key]
   FIRECRAWL_API_KEY = [your key]
   MILLION_VERIFIER_API_KEY = [your key]
   PROSPEO_API_KEY = [your key]
   EXPANDI_API_KEY = [your key]
   BOUNCEBAN_API_KEY = [your key]
   ```

6. Click "Deploy"

**Worker should start automatically.**

---

### 4.5 Add REDIS_URL to Vercel

1. Go back to Vercel project
2. Settings → Environment Variables
3. Find `REDIS_URL` (or add if not present)
4. Paste Railway Redis URL
5. Check "Production" environment
6. Save

**Redeploy Vercel** (Deployments → Redeploy)

---

### 4.6 Verify Worker is Running

**In Railway dashboard:**
1. Click Worker service
2. Go to "Deployments" tab
3. Should show "Active"
4. Check logs (should see "Worker started")

**Test job processing:**
1. Submit a search via app (leads.corsyx.com)
2. Check Railway worker logs
3. Should see job picked up and processed

---

## Part 5: Custom Domain Setup (leads.corsyx.com)

### 5.1 Add Domain in Vercel

1. Vercel project → Settings → Domains
2. Click "Add"
3. Enter: `leads.corsyx.com`
4. Click "Add"

**Vercel will show DNS configuration needed:**
```
Type: CNAME
Name: leads
Value: cname.vercel-dns.com
```

**Keep this page open** - you'll need these values for Cloudflare.

---

### 5.2 Configure DNS in Cloudflare

1. Log in to Cloudflare: https://dash.cloudflare.com
2. Select domain: `corsyx.com`
3. Go to DNS → Records
4. Click "Add record"

**Add CNAME record:**
```
Type: CNAME
Name: leads
Target: cname.vercel-dns.com
Proxy status: DNS only (gray cloud - NOT proxied)
TTL: Auto
```

5. Click "Save"

**Important:** Make sure proxy is OFF (gray cloud). Vercel needs direct DNS.

---

### 5.3 Verify Domain in Vercel

1. Go back to Vercel Domains settings
2. Click "Verify" or "Refresh"
3. Status should change:
   - ❌ "Invalid Configuration"
   - → ⏳ "Pending Verification"
   - → ✅ "Valid Configuration"

**Wait 5-30 minutes for DNS propagation.**

---

### 5.4 Update NEXT_PUBLIC_APP_URL

Once domain verified:

1. Vercel → Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update value to: `https://leads.corsyx.com`
4. Save

**Redeploy Vercel** (Deployments → Redeploy)

---

### 5.5 Test Custom Domain

1. Open browser
2. Go to: https://leads.corsyx.com
3. Should see app (not Vercel's domain)
4. SSL certificate should be valid (automatic from Vercel)

**If not working:**
- Check DNS propagation: https://dnschecker.org
- Enter `leads.corsyx.com`
- Should show CNAME pointing to `cname.vercel-dns.com`
- Wait longer (can take up to 48 hours, usually 5-30 minutes)

---

## Part 6: SSL Certificate (Automatic)

Vercel automatically provisions SSL certificates via Let's Encrypt.

**Verify SSL:**
1. Visit https://leads.corsyx.com
2. Click padlock icon in browser
3. Certificate should show:
   - Issued to: leads.corsyx.com
   - Issued by: Let's Encrypt
   - Valid

**If certificate invalid:**
- Wait 5-10 minutes (provisioning takes time)
- Ensure domain verified in Vercel
- Check Cloudflare proxy is OFF (gray cloud)

---

## Part 7: Deployment Verification Checklist

After completing all steps, verify everything works:

### Frontend (Vercel)
- [ ] App accessible at https://leads.corsyx.com
- [ ] SSL certificate valid
- [ ] Landing page loads
- [ ] Can navigate to /search page

### Database (Supabase)
- [ ] DATABASE_URL set in Vercel
- [ ] Migrations applied
- [ ] Tables exist (Search, Company, Contact, Job)
- [ ] Can create records

### Workers (Railway)
- [ ] Worker service running
- [ ] REDIS_URL set in Vercel
- [ ] Job queue working
- [ ] Worker picks up jobs from queue

### API Keys
- [ ] All 7 API keys added to Vercel
- [ ] Keys not exposed in frontend code
- [ ] API calls succeed (test each integration)

### End-to-End Test
- [ ] Submit a search via UI
- [ ] Job queued in Redis
- [ ] Worker picks up job
- [ ] API calls succeed (Apollo, DeepSeek, etc.)
- [ ] Results saved to database
- [ ] Results displayed in UI
- [ ] Can download CSV

---

## Part 8: Troubleshooting

### Issue: Vercel Deployment Fails

**Symptoms:** Build fails, deployment shows error

**Fixes:**
1. Check build logs in Vercel dashboard
2. Common causes:
   - Missing environment variables
   - TypeScript errors (run `npm run type-check` locally)
   - Database connection fails (check DATABASE_URL)
3. Fix locally first, then push to GitHub

---

### Issue: Database Connection Error

**Symptoms:** `PrismaClientInitializationError`

**Fixes:**
1. Verify DATABASE_URL is correct in Vercel env vars
2. Check Supabase database is running (Supabase dashboard)
3. Test connection locally:
   ```bash
   DATABASE_URL="[supabase-url]" npx prisma studio
   ```
4. Ensure IP allowlist in Supabase allows Vercel (usually allowed by default)

---

### Issue: Worker Not Processing Jobs

**Symptoms:** Jobs stuck in queue, worker logs show errors

**Fixes:**
1. Check Railway worker logs (Railway dashboard → Worker → Logs)
2. Verify REDIS_URL correct in worker env vars
3. Verify DATABASE_URL correct in worker env vars
4. Check API keys are set in worker env vars
5. Restart worker service (Railway → Deployments → Redeploy)

---

### Issue: Custom Domain Not Working

**Symptoms:** leads.corsyx.com shows error or doesn't load

**Fixes:**
1. Check DNS propagation: https://dnschecker.org
2. Verify CNAME record in Cloudflare:
   - Name: `leads`
   - Target: `cname.vercel-dns.com`
   - Proxy: OFF (gray cloud)
3. Verify domain in Vercel shows "Valid Configuration"
4. Clear browser cache (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
5. Wait longer (DNS can take 48 hours, usually faster)

---

### Issue: SSL Certificate Invalid

**Symptoms:** Browser shows "Not Secure" warning

**Fixes:**
1. Wait 10 minutes (Vercel provisions certificates automatically)
2. Ensure domain verified in Vercel
3. Check Cloudflare proxy is OFF (gray cloud, not orange)
4. Redeploy Vercel (sometimes triggers certificate refresh)

---

### Issue: API Calls Failing

**Symptoms:** Search fails, errors in logs about API connections

**Fixes:**
1. Verify API keys are correct in Vercel env vars
2. Test each API key independently:
   - Apollo: Test in Apollo dashboard
   - DeepSeek: Test via curl/Postman
   - Million Verifier: Test in their dashboard
3. Check API rate limits (might be exceeded)
4. Verify API keys have correct permissions/scopes

---

## Part 9: Monitoring & Maintenance

### Vercel Monitoring

**Check deployment health:**
1. Vercel dashboard → Analytics
2. View:
   - Response times
   - Error rates
   - Traffic volume

**Set up alerts:**
1. Settings → Notifications
2. Enable email alerts for:
   - Deployment failures
   - High error rates

---

### Railway Worker Monitoring

**Check worker health:**
1. Railway dashboard → Worker service → Metrics
2. Monitor:
   - CPU usage
   - Memory usage
   - Restart count

**View logs:**
1. Railway → Worker → Deployments → View Logs
2. Check for errors in job processing

---

### Database Monitoring

**Supabase monitoring:**
1. Supabase dashboard → Database → Metrics
2. Monitor:
   - Storage usage (500MB limit on free tier)
   - Connection count
   - Query performance

**Set up alerts:**
1. Settings → Notifications
2. Alert when storage >80% full

---

### Cost Monitoring

**Monthly costs (estimated for MVP):**
```
Vercel:              $0 (free tier)
Supabase:            $0 (free tier, <500MB)
Railway:             $0-5 (free tier credit)
Apollo:              [your existing subscription]
DeepSeek:            ~$2-5 per month (usage-based)
Firecrawl:           ~$10-20 per month
Million Verifier:    [your existing subscription]
─────────────────────────────────────
Total:               ~$12-30/month (excluding existing subscriptions)
```

**Monitor usage:**
- Vercel: Dashboard → Usage
- Railway: Dashboard → Usage
- Supabase: Dashboard → Billing

**Upgrade when:**
- Vercel: >100GB bandwidth/month → Pro plan ($20/month)
- Supabase: >500MB storage → Pro plan ($25/month)
- Railway: Free credit exhausted → Pay as you go

---

## Part 10: Scaling Considerations

### When to Scale (Post-MVP)

**Triggers:**
- 10+ concurrent users
- 100+ searches per day
- Database >400MB (80% of free tier)
- Worker processing lag >30 minutes

**Scaling steps:**
1. **Upgrade Vercel to Pro** ($20/month)
   - 1000 GB bandwidth
   - More function executions
   - Better performance

2. **Upgrade Supabase to Pro** ($25/month)
   - 8GB storage
   - Better performance
   - Daily backups

3. **Add More Railway Workers**
   - Deploy 2nd worker instance
   - Process jobs in parallel
   - Faster search completion

4. **Add Redis Caching**
   - Cache scraped website data (30 days)
   - Cache Apollo company data
   - Reduce API costs by 30-40%

---

## Part 11: Backup & Disaster Recovery

### Database Backups

**Supabase automatic backups:**
- Free tier: No automatic backups
- Pro tier: Daily backups (7-day retention)

**Manual backup (MVP):**
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Store in secure location (Google Drive, Dropbox)
```

**Recovery:**
```bash
# Restore from backup
psql $DATABASE_URL < backup-20260802.sql
```

---

### Code Backups

**GitHub is primary backup:**
- All code in `Angela0023/unified-lead-platform`
- Enable branch protection on `main`
- Require PRs for changes

**Additional protection:**
1. Tag releases:
   ```bash
   git tag -a v1.0.0 -m "MVP Release"
   git push origin v1.0.0
   ```

2. Create releases on GitHub (Assets tab)

---

### Environment Variables Backup

**Store securely offline:**
1. Export from Vercel (Settings → Environment Variables)
2. Save to password manager (1Password, LastPass)
3. Document in secure note (not in git!)

**Format:**
```bash
# Unified Lead Platform - Production Env Vars
# Last updated: 2026-08-02
# DO NOT COMMIT TO GIT

DATABASE_URL=postgresql://...
REDIS_URL=redis://...
APOLLO_API_KEY=...
# etc.
```

---

## Part 12: Post-MVP Enhancements

### Enabling Multi-Source Email Enrichment

**When ready to enable Prospeo/Expandi (v1.1.0):**

1. **Already have keys in Vercel** ✅ (added in Part 2.3)

2. **Update code** (in `src/integrations`):
   - Implement `/prospeo/client.ts`
   - Implement `/expandi/client.ts`
   - Update email enrichment workflow to cascade:
     ```typescript
     // Pseudocode
     email = await apollo.getEmail(contact);
     if (!email) email = await prospeo.getEmail(contact);
     if (!email) email = await expandi.getEmail(contact);
     ```

3. **Deploy** (push to GitHub → auto-deploy)

4. **Test** with real search

**No environment changes needed** - keys already in place!

---

### Enabling BounceBan Validation

**When ready to enable (v1.1.0):**

1. **Already have key in Vercel** ✅

2. **Update code**:
   - Implement `/bounceban/client.ts`
   - Add to validation workflow:
     ```typescript
     if (emailStatus === 'risky') {
       const recheck = await bounceban.validate(email);
       emailStatus = recheck.status;
     }
     ```

3. **Deploy**

**No environment changes needed!**

---

## Summary: Deployment Checklist

**Complete this checklist before going live:**

### Pre-Deployment
- [ ] MVP development complete (Sprint 13)
- [ ] Code pushed to GitHub
- [ ] All API keys obtained (7 total)
- [ ] Accounts created (Vercel, Supabase, Railway)

### Vercel Setup
- [ ] Project imported from GitHub
- [ ] Environment variables added (all 7 API keys + infrastructure)
- [ ] Deployment successful
- [ ] App accessible at vercel.app domain

### Database Setup
- [ ] Supabase project created
- [ ] Migrations applied
- [ ] DATABASE_URL added to Vercel
- [ ] Tables verified in Supabase

### Worker Setup
- [ ] Redis deployed on Railway
- [ ] Worker service deployed
- [ ] All env vars added to worker
- [ ] Worker logs show "started"
- [ ] REDIS_URL added to Vercel

### Domain Setup
- [ ] Domain added in Vercel (leads.corsyx.com)
- [ ] CNAME record added in Cloudflare
- [ ] Domain verified in Vercel
- [ ] SSL certificate valid
- [ ] NEXT_PUBLIC_APP_URL updated

### Testing
- [ ] End-to-end search test passes
- [ ] All API integrations working
- [ ] Results saved to database
- [ ] CSV export works
- [ ] No errors in logs

### Production Ready
- [ ] Monitoring enabled
- [ ] Backups documented
- [ ] Team trained on deployment process
- [ ] Rollback procedure documented

---

**Deployment Status:** Ready for Sprint 14

**Estimated Time:** 2-3 hours (first time), 30 minutes (subsequent deployments)

**Next:** Train Angela on using production app

---

**Last Updated:** 2026-08-02
**Created By:** Claude Sonnet 4.5
**Version:** 1.0 (MVP Deployment)
