# Handoff to DeepSeek for Development - Unified Lead Platform

> **Date:** 2026-08-02
> **From:** Claude Sonnet 4.5 (Planning & Architecture)
> **To:** DeepSeek (Development & Implementation)
> **Purpose:** Cost-efficient MVP development

---

## Your Mission (DeepSeek)

You are taking over **development and implementation** of the Unified Lead Platform. All planning is complete. Your job is to **build the MVP** following the documented architecture.

**Cost Optimization Strategy:**
- DeepSeek does: Initial coding, boilerplate setup, integration implementation
- Sonnet reviews: Architecture decisions, final verification, production deployment

---

## What's Been Done (By Sonnet)

✅ **Complete Planning Documentation:**
- README.md - Project overview
- PLANNING.md - Full requirements (15,000+ words)
- ARCHITECTURE.md - Technical stack & design
- WORKFLOW.md - 11-stage quality gate system
- QUALITY-GATES.md - Detailed gate implementation
- BOTTLENECKS.md - Risk analysis & mitigation
- BEST-SCENARIO.md - Success milestones
- DEVELOPMENT-WORKFLOW.md - Safe development practices
- DECISIONS.md - Design decisions log
- TODO.md - Task tracking
- CHANGELOG.md - Version tracking

✅ **GitHub Repository:**
- Repo: Angela0023/unified-lead-platform
- Branch: main
- All documentation pushed and committed

---

## Your Starting Point

**Current Status:** v0.1.0 - Planning Complete

**Your Next Tasks:** Follow TODO.md sequentially

### Immediate Next Steps (Sprint 2):

1. **Environment Setup**
   - [ ] Initialize Next.js project
   - [ ] Set up TypeScript
   - [ ] Configure Tailwind CSS
   - [ ] Install Shadcn UI
   - [ ] Set up Prisma ORM
   - [ ] Create database schema
   - [ ] Set up BullMQ + Redis

2. **Create Project Structure**
   ```
   /src
     /app                 (Next.js 14 App Router)
     /components          (Shadcn UI components)
     /integrations
       /apollo
       /deepseek
       /firecrawl
       /million-verifier
     /lib                 (Utilities)
   /prisma
     schema.prisma
   ```

3. **Start with Stage 0: Search Form UI**
   - Read WORKFLOW.md Stage 0 section
   - Read QUALITY-GATES.md Gate 0 section
   - Implement search form page
   - Follow DEVELOPMENT-WORKFLOW.md (feature branch, testing, PR)

---

## Critical Rules You Must Follow

### 1. Read Documentation BEFORE Coding
- **Before starting any task**, read the relevant section in:
  - WORKFLOW.md (what the feature should do)
  - QUALITY-GATES.md (quality requirements)
  - ARCHITECTURE.md (technical approach)
  - DEVELOPMENT-WORKFLOW.md (how to safely make changes)

### 2. Follow the Architecture
- **Modular design:** Each integration in separate folder
- **TypeScript:** No `any` types, use proper types
- **Prisma:** Use ORM for all database access
- **Next.js App Router:** Use app directory, not pages

### 3. Use Git Properly
- **Never commit to main directly**
- Create feature branches: `feature/search-form`, `feature/apollo-integration`
- Commit messages must be clear (see examples in DEVELOPMENT-WORKFLOW.md)
- Push regularly to GitHub

### 4. Security
- **Never commit API keys**
- Use environment variables (.env.local)
- .gitignore is already set up, don't override it

### 5. Testing
- Test every feature locally before pushing
- Follow manual testing checklist in DEVELOPMENT-WORKFLOW.md
- No breaking changes allowed

---

## Technology Stack (Already Decided)

**Read ARCHITECTURE.md for full details**

- **Frontend:** Next.js 14 (App Router) + Tailwind + Shadcn UI
- **Backend:** Next.js API Routes + Node.js workers
- **Database:** PostgreSQL (Supabase)
- **Queue:** BullMQ + Redis
- **ORM:** Prisma
- **Hosting:** Vercel (frontend) + Railway (workers)

**Do NOT change the stack.** These decisions are final (see DECISIONS.md for rationale).

---

## How to Start Development

### Step 1: Clone Repository

```bash
cd /Users/angelapetkovska/Desktop/Claude\ Clients/
git clone https://github.com/Angela0023/unified-lead-platform.git
cd unified-lead-platform
```

### Step 2: Initialize Next.js Project

```bash
# Create Next.js app
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# Answer prompts:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind: Yes
# - App Router: Yes
# - Import alias: @/*

# Install additional dependencies
npm install @prisma/client prisma
npm install bullmq redis
npm install @radix-ui/react-* (Shadcn components as needed)
```

### Step 3: Set Up Prisma

```bash
# Initialize Prisma
npx prisma init

# Update prisma/schema.prisma with schema from ARCHITECTURE.md
# (Copy the full schema from ARCHITECTURE.md "Database Schema" section)

# Run migration
npx prisma migrate dev --name init
```

### Step 4: Create .env.local

```bash
# Copy from example
cp .env.example .env.local

# Fill in values (Angela will provide API keys)
```

### Step 5: Start Development Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Development Workflow (CRITICAL)

**Follow DEVELOPMENT-WORKFLOW.md exactly:**

1. Create feature branch: `git checkout -b feature/search-form`
2. Make changes
3. Test locally
4. Commit with clear message
5. Push to GitHub
6. Test in Vercel preview
7. Create PR
8. Merge to main

**Never skip steps. Never commit directly to main.**

---

## Task Priority Order (From TODO.md)

### Sprint 2: Environment Setup ⏳
Do this FIRST before any coding

### Sprint 3: Stage 0 - Search Form UI ⏳
- Read WORKFLOW.md Stage 0
- Read QUALITY-GATES.md Gate 0
- Implement search form
- Test locally
- Push to GitHub

### Sprint 4: Stage 1 - Pre-flight Checks ⏳
- Read WORKFLOW.md Stage 1
- Read QUALITY-GATES.md Gate 1
- Implement API health checks
- Test with real API keys (Angela provides)

### Continue with TODO.md task list
Follow sequentially, don't skip ahead

---

## When to Ask Sonnet for Help

**You (DeepSeek) handle:**
- Writing boilerplate code
- Implementing documented features
- Setting up integrations
- Creating UI components
- Writing database queries

**Hand back to Sonnet for:**
- Architecture changes (if something doesn't make sense)
- Complex design decisions
- Production deployment review
- Final verification before Angela uses it
- Any breaking changes

---

## Progress Reporting

**After each sprint, update:**
1. TODO.md - Mark tasks complete
2. CHANGELOG.md - Add entry for what was done
3. DECISIONS.md - If you made any design choices, document why

**Format in CHANGELOG.md:**
```markdown
## [0.2.0] - 2026-08-XX

### Added
- Next.js project initialized
- Prisma schema set up
- Search form UI implemented

### Decisions
- Chose pnpm over npm (faster, disk efficient)

### Testing
- Tested search form locally
- All validations working
```

---

## API Keys Angela Will Provide

You'll need these environment variables (Angela provides values):

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# API Keys
APOLLO_API_KEY=
DEEPSEEK_API_KEY=
FIRECRAWL_API_KEY=
MILLION_VERIFIER_API_KEY=

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Never commit .env.local** - It's already in .gitignore

---

## Quality Checklist (Before Every Commit)

- [ ] Read documentation for the feature
- [ ] Implemented exactly as designed
- [ ] TypeScript types correct (no `any`)
- [ ] Tested locally (works as expected)
- [ ] No console errors
- [ ] No breaking changes to existing code
- [ ] Followed modular architecture
- [ ] Committed to feature branch (not main)
- [ ] Clear commit message
- [ ] Updated TODO.md progress

---

## Common Pitfalls to Avoid

❌ **Don't:**
- Change the architecture without asking Sonnet
- Skip documentation reading
- Commit to main directly
- Use `any` types in TypeScript
- Hardcode values (use env vars)
- Skip testing
- Make changes outside the current task

✅ **Do:**
- Follow documentation strictly
- Ask questions if unclear
- Test thoroughly
- Commit frequently
- Use feature branches
- Keep code modular
- Update TODO.md as you go

---

## Example: Implementing Stage 0 (Search Form)

**Step-by-step example to show you the process:**

### 1. Read Documentation
- Open WORKFLOW.md, read "Stage 0: Prompt Intake & Structuring"
- Open QUALITY-GATES.md, read "Gate 0: Prompt Intake & Structuring"
- Understand: What inputs? What validation? What output?

### 2. Create Feature Branch
```bash
git checkout -b feature/stage-0-search-form
```

### 3. Create Search Page
```bash
# Create file: app/search/page.tsx
```

### 4. Implement UI
```typescript
// Use Shadcn UI components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function SearchPage() {
  // Industry selector
  // Company size selector
  // Location selector
  // Target role input
  // ICP prompt textarea
  // Submit button
}
```

### 5. Add Validation
```typescript
// Required fields check
// ICP prompt minimum length (20 chars)
// Show errors if validation fails
```

### 6. Test Locally
```bash
npm run dev
# Open http://localhost:3000/search
# Fill form, test validation, check errors
```

### 7. Commit
```bash
git add app/search/page.tsx
git commit -m "Implement Stage 0: Search form UI

- Created search page with filters and ICP prompt
- Added validation (required fields, min length)
- Used Shadcn UI components for consistent design
- Tested locally, all validations working

Implements: WORKFLOW.md Stage 0, QUALITY-GATES.md Gate 0
No breaking changes
"
```

### 8. Push and Test
```bash
git push origin feature/stage-0-search-form
# Vercel automatically creates preview
# Test in preview URL
```

### 9. Create PR and Merge
- GitHub: Create PR
- Review changes
- Merge to main

### 10. Update Docs
- TODO.md: Mark Stage 0 tasks complete
- CHANGELOG.md: Add entry

---

## Communication Protocol

**Use TODO.md as communication channel:**

When you complete a task:
```markdown
- [x] Create search form UI ✅ 2026-08-05 (DeepSeek)
  - Implemented with Shadcn UI
  - All validations working
  - Tested locally and in Vercel preview
  - PR merged to main
```

When you're blocked:
```markdown
- [ ] Set up Apollo integration ⏸️ BLOCKED
  - Need API key from Angela
  - Waiting for credentials
```

**Angela will review TODO.md to see progress and unblock you.**

---

## Success Criteria for Your Work

Before handing back to Sonnet for final review, ensure:

✅ **MVP is functional:**
- All Stages 0-7, 9 implemented
- Can run end-to-end search
- Results are correct

✅ **Quality is high:**
- No TypeScript errors
- No console errors
- All features tested
- Follows architecture exactly

✅ **Documentation is updated:**
- TODO.md reflects progress
- CHANGELOG.md has entries
- DECISIONS.md has any choices you made

✅ **Code is clean:**
- Modular (each integration isolated)
- Well-typed (no `any`)
- Commented (complex logic only)
- Git history is clear

**When ready, update HANDOFF.md with "Ready for Sonnet Review" and Angela will switch back.**

---

## Quick Reference

| Document | Purpose | When to Read |
|----------|---------|--------------|
| README.md | Project overview | First time orientation |
| TODO.md | Task list | Every day (track progress) |
| WORKFLOW.md | What each stage does | Before implementing each stage |
| QUALITY-GATES.md | How each gate works | Before implementing each stage |
| ARCHITECTURE.md | Technical stack & design | When setting up integrations |
| DEVELOPMENT-WORKFLOW.md | Git workflow | Every time you commit |
| DECISIONS.md | Why decisions were made | When questioning design |
| BOTTLENECKS.md | Known risks | When hitting issues |

---

## Final Words

You've inherited **excellent planning**. Everything is documented. Your job is to **execute faithfully**.

**Don't improvise. Don't skip documentation. Don't change architecture.**

Follow the plan, write clean code, test thoroughly, and we'll have a working MVP in 2 months.

**Good luck! 🚀**

---

**Last Updated:** 2026-08-02
**Status:** Ready for Development
**Next:** Environment Setup (Sprint 2)
