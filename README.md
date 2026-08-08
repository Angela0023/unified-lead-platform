# Unified Lead Platform

> **Smart lead generation engine that replaces manual workflows across Apollo, Expandi, Prospeo, Million Verifier, and more.**

---

## What This Solves

**Current Problem:**
- 40 hours/week spent manually finding leads for one client
- Juggling 5+ different tools (Apollo, Expandi, Prospeo, Million Verifier, BounceBan)
- Wasting credits on companies that aren't a good fit
- Manual email verification and enrichment across multiple platforms

**Solution:**
A single platform where you:
1. Set filters + describe your ICP in plain English
2. Click "Find Leads"
3. Get validated, enriched leads delivered automatically

**Time Saved:** 40 hours → 15 minutes per search (160x improvement)

---

## How It Works

**User Experience:**
1. Open web dashboard
2. Set filters: Industry, company size, location, target role
3. Write ICP prompt: "B2B SaaS companies selling to enterprises, 50-200 employees, API-first products"
4. Click "Find Leads"
5. System shows: "Searching... estimated delivery in 45 minutes"
6. Background: AI validates companies, finds contacts, enriches emails, verifies validity
7. Download CSV: Clean list of validated leads

**What Happens Behind the Scenes:**
- Apollo finds companies matching your criteria
- DeepSeek AI scores each company 1-5 against your ICP (removes bad fits)
- Apollo finds decision makers at validated companies
- Email enrichment across multiple sources
- Million Verifier validates all emails
- Delivers only valid, qualified leads

---

## Repository Structure

```
unified-lead-platform/
├── README.md              ← You are here (project overview)
├── PLANNING.md            ← Full planning discussion and decisions
├── ARCHITECTURE.md        ← Technical architecture and stack
├── WORKFLOW.md            ← Detailed lead generation workflow
├── BOTTLENECKS.md         ← Risks, limitations, and solutions
├── BEST-SCENARIO.md       ← Ideal implementation vision
├── CHANGELOG.md           ← All updates tracked here
├── DECISIONS.md           ← Design rules and lessons learned
├── TODO.md                ← Next steps and tasks
├── .gitignore             ← Security (API keys never committed)
│
└── /docs                  ← Additional documentation (added later)
└── /src                   ← Source code (added when development starts)
```

---

## Current Status

**Phase:** MVP Development (Sprints 3-13 complete, pending Sonnet review)
**Last Updated:** 2026-08-02
**GitHub Repo:** `Angela0023/unified-lead-platform`
**Local demo:** `npm run dev` (Demo Mode enabled until API keys are added)

---

## Quick Links

- [Full Planning Document](PLANNING.md) - Complete conversation and requirements
- [Technical Architecture](ARCHITECTURE.md) - How the system is built
- [Lead Gen Workflow](WORKFLOW.md) - Step-by-step process
- [Potential Bottlenecks](BOTTLENECKS.md) - Risks and mitigation
- [Best Scenario Vision](BEST-SCENARIO.md) - What success looks like
- [Changelog](CHANGELOG.md) - Track all changes
- [Design Decisions](DECISIONS.md) - Rules and lessons
- [Deployment Guide](DEPLOYMENT.md) - How to deploy to production
- [Setup Guide](docs/SETUP.md) - Local dev + API keys

---

## Core Principles

1. **Stability First:** Modular architecture where changes to one integration don't break others
2. **Everything Documented:** Every change tracked in CHANGELOG.md, every rule in DECISIONS.md
3. **GitHub Always Updated:** Push to GitHub after every significant update
4. **Separate Files for Separate Concerns:** No mixing, easy to modify
5. **Built for Business:** This is serious software for agencies, not a prototype

---

## For Developers

- **Tech Stack:** Next.js (frontend + API), PostgreSQL, BullMQ (queue), Redis
- **APIs:** Apollo, Expandi, Prospeo, Million Verifier, BounceBan, DeepSeek, Firecrawl/Apify
- **Hosting:** Vercel (free tier for MVP)
- **Testing:** Start with Angela's current clients before external launch

---

## Contact

**Owner:** Angela Petkovska
**GitHub:** Angela0023
**Purpose:** Internal use for client lead generation → SaaS product after validation
