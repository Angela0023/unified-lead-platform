# Design Requirements - Unified Lead Platform

> **Professional, clean, modern UI design requirements**
>
> **Updated:** 2026-08-05

---

## Design Principles

1. **Professional & Clean** - This is enterprise B2B software, not a consumer app
2. **Dark/Light Mode** - Support both themes with smooth toggle
3. **High Contrast & Readable** - Clear hierarchy, easy to scan
4. **Consistent Spacing** - Use Tailwind's spacing scale consistently
5. **Minimal Distractions** - Focus on the workflow, remove unnecessary elements

---

## Color Palette

### Dark Mode (Primary)
```css
Background: #0a0a0a (nearly black)
Surface: #171717 (elevated cards)
Border: #262626 (subtle borders)
Text Primary: #ffffff
Text Secondary: #a3a3a3
Accent: #6366f1 (indigo-500) - primary actions
Accent Hover: #4f46e5 (indigo-600)
Success: #22c55e (green-500)
Warning: #f59e0b (amber-500)
Error: #ef4444 (red-500)
```

### Light Mode
```css
Background: #ffffff
Surface: #f9fafb (gray-50)
Border: #e5e7eb (gray-200)
Text Primary: #111827 (gray-900)
Text Secondary: #6b7280 (gray-500)
Accent: #6366f1 (indigo-500)
Accent Hover: #4f46e5 (indigo-600)
Success: #22c55e
Warning: #f59e0b
Error: #ef4444
```

---

## Typography

### Font Family
- **Primary:** Inter (sans-serif) - clean, professional, highly readable
- **Monospace:** JetBrains Mono - for code, IDs, technical data

### Scale
```css
Display (Hero): text-6xl font-bold (60px)
H1: text-4xl font-bold (36px)
H2: text-2xl font-semibold (24px)
H3: text-xl font-semibold (20px)
Body: text-base (16px)
Small: text-sm (14px)
Tiny: text-xs (12px)
```

### Line Height
- Headings: leading-tight (1.25)
- Body: leading-relaxed (1.625)
- Forms: leading-normal (1.5)

---

## Component Design

### Search Form

**Reference:** See mockup (form-mockup.png)

**Structure:**
```
┌─────────────────────────────────────────┐
│ Industry *                              │
│ ┌─────────────────────────────────────┐ │
│ │ Select industries...              ▼ │ │
│ └─────────────────────────────────────┘ │
│   ☐ Software                            │
│   ☐ Information Technology & Services   │
│   ☐ Financial Services                  │
│                                         │
│ Location *                              │
│ ┌─────────────────────────────────────┐ │
│ │ Select locations...               ▼ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Target Company Count *                  │
│ ┌─────────────────────────────────────┐ │
│ │ 500                                  │ │
│ └─────────────────────────────────────┘ │
│ We'll keep searching until we reach     │
│ this count (accounting for rejections)  │
│                                         │
│ Expected Leads *                        │
│ ┌─────────────────────────────────────┐ │
│ │ 2                                    │ │
│ └─────────────────────────────────────┘ │
│ No options selected                     │
│                                         │
│ 500 companies × 2 decision makers       │
│ = 1000 total leads                      │
└─────────────────────────────────────────┘
```

**Key Features:**
- Required fields marked with *
- Helper text below inputs (gray, small)
- Real-time calculation: companies × contacts = total leads
- Clean checkboxes for multi-select
- Subtle borders, good padding
- Labels above inputs (not floating)

### Buttons

**Primary (Accent):**
```tsx
className="bg-indigo-600 hover:bg-indigo-700 text-white
           font-medium px-6 py-3 rounded-lg transition-colors
           shadow-sm hover:shadow-md"
```

**Secondary:**
```tsx
className="border border-gray-300 dark:border-gray-700
           hover:bg-gray-50 dark:hover:bg-gray-800
           text-gray-900 dark:text-gray-100
           font-medium px-6 py-3 rounded-lg transition-colors"
```

**Destructive:**
```tsx
className="bg-red-600 hover:bg-red-700 text-white
           font-medium px-4 py-2 rounded-lg transition-colors"
```

### Cards

```tsx
className="bg-white dark:bg-neutral-900
           border border-gray-200 dark:border-neutral-800
           rounded-xl p-6 shadow-sm"
```

### Inputs

```tsx
className="w-full px-4 py-3
           border border-gray-300 dark:border-gray-700
           bg-white dark:bg-neutral-900
           text-gray-900 dark:text-gray-100
           rounded-lg focus:ring-2 focus:ring-indigo-500
           focus:border-transparent transition-colors"
```

---

## Layout

### Container Widths
- Landing page: max-w-7xl (1280px)
- Search form: max-w-2xl (672px)
- Results: max-w-7xl
- Progress view: max-w-4xl

### Spacing
- Section padding: py-16 px-6
- Card padding: p-6
- Form field spacing: space-y-4
- Button groups: gap-4

---

## Dark Mode Implementation

### Next Themes Setup
```tsx
// app/providers.tsx
import { ThemeProvider } from 'next-themes'

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      {children}
    </ThemeProvider>
  )
}
```

### Toggle Component
```tsx
// components/theme-toggle.tsx
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <Sun className="h-5 w-5 dark:hidden" />
      <Moon className="h-5 w-5 hidden dark:block" />
    </button>
  )
}
```

### Usage in Tailwind
```tsx
// Light mode
className="bg-white text-gray-900"

// Dark mode
className="bg-white dark:bg-neutral-900
           text-gray-900 dark:text-gray-100"
```

---

## Landing Page Design

**Reference:** See mockup (landing-mockup.png)

### Hero Section
```
┌────────────────────────────────────────────┐
│         ⭐ Top-rated Agency 2024           │
│                                            │
│     Bridging Vision                        │
│   with Expert Execution                    │
│                                            │
│  Elite network of developers, designers,   │
│  and strategists. We help high-growth      │
│  companies scale products with precision.  │
│                                            │
│  [ Hire our Agency → ] [ Browse Jobs ]    │
└────────────────────────────────────────────┘
```

**Adapt for Lead Platform:**
```
┌────────────────────────────────────────────┐
│       🚀 Trusted by Growth Agencies        │
│                                            │
│     Smart Lead Generation                  │
│   That Actually Works                      │
│                                            │
│  Replace 40 hours of manual work with      │
│  15 minutes. AI-powered validation         │
│  ensures only quality leads.               │
│                                            │
│  [ Find Leads → ]  [ View Demo ]          │
└────────────────────────────────────────────┘
```

### Key Elements:
- Badge at top (small, pill-shaped, with icon)
- Large, bold headline (2 lines max)
- Supporting text (2-3 lines, gray)
- 2 CTA buttons (primary + secondary)
- Centered layout
- Lots of whitespace
- Dark background with white/light gray text

---

## Progress View Design

### Status Cards
```
┌─────────────────────────────────────┐
│ ✓ Company Discovery                 │
│ Found 247 companies                  │
│ Completed in 3m 24s                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ⏳ Company Validation                │
│ Validating 247 companies...          │
│ 156/247 validated (63%)              │
│ Est. 12m remaining                   │
└─────────────────────────────────────┘
```

**Features:**
- Icon indicating state (✓ done, ⏳ in progress, ⏸ pending)
- Phase name (bold)
- Current status (regular weight)
- Progress bar if in progress
- Time estimate

---

## Results Table Design

### Clean, Scannable Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Company          | Contact         | Email             | Score  │
├─────────────────────────────────────────────────────────────────┤
│ Acme Corp        │ John Smith      │ john@acme.com     │ ⭐⭐⭐⭐⭐ │
│ Software, 150    │ CTO             │ ✓ Valid           │ 5      │
│                  │                 │                   │        │
│ BetaCo           │ Jane Doe        │ jane@betaco.io    │ ⭐⭐⭐⭐   │
│ SaaS, 80         │ VP Engineering  │ ⚠ Risky          │ 4      │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Alternating row colors (subtle)
- Icons for email status (✓ ⚠ ✗)
- Stars for company score (visual)
- Sub-info in smaller, gray text
- Hover effect on rows
- Sortable columns

---

## Accessibility

### Requirements
- **Contrast Ratio:** Minimum 4.5:1 for text
- **Focus Indicators:** Visible ring on all interactive elements
- **Keyboard Navigation:** Full support (tab, enter, escape)
- **ARIA Labels:** On all form fields, buttons
- **Screen Reader:** Proper heading hierarchy (h1 → h2 → h3)

### Focus Rings
```tsx
className="focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
           dark:focus:ring-offset-gray-900"
```

---

## Animation & Transitions

### Page Transitions
```tsx
className="transition-all duration-200 ease-in-out"
```

### Hover States
```tsx
className="hover:scale-105 transition-transform"
```

### Loading States
```tsx
<div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-4 rounded" />
```

---

## Responsive Design

### Breakpoints (Tailwind)
```
sm: 640px   (mobile landscape)
md: 768px   (tablet)
lg: 1024px  (laptop)
xl: 1280px  (desktop)
2xl: 1536px (large desktop)
```

### Mobile-First Classes
```tsx
// Stack on mobile, side-by-side on desktop
className="flex flex-col md:flex-row gap-4"

// Full width on mobile, constrained on desktop
className="w-full md:w-auto"

// Hide on mobile, show on desktop
className="hidden md:block"
```

---

## Icons

### Library: Lucide React
```bash
npm install lucide-react
```

### Usage
```tsx
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'

<CheckCircle className="h-5 w-5 text-green-500" />
<AlertCircle className="h-5 w-5 text-amber-500" />
<XCircle className="h-5 w-5 text-red-500" />
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Install next-themes for dark mode
- [ ] Configure Tailwind for dark mode (class strategy)
- [ ] Add ThemeProvider to root layout
- [ ] Create ThemeToggle component
- [ ] Update global CSS with dark mode vars

### Phase 2: Components
- [ ] Redesign search form (match mockup)
- [ ] Redesign landing page hero
- [ ] Update all buttons (primary, secondary, destructive)
- [ ] Update all input fields (consistent styling)
- [ ] Update card components

### Phase 3: Pages
- [ ] Redesign landing page (/)
- [ ] Redesign search form (/search)
- [ ] Redesign progress view (/search/:id/progress)
- [ ] Redesign results view (/search/:id/results)

### Phase 4: Polish
- [ ] Add smooth transitions
- [ ] Add loading states
- [ ] Test dark/light mode on all pages
- [ ] Test responsive on mobile/tablet/desktop
- [ ] Verify accessibility (keyboard nav, screen readers)

---

## Status

**Current:** Outdated design, poor readability
**Target:** Professional, clean, dark/light mode support
**Priority:** HIGH - blocking user adoption

---

**Last Updated:** 2026-08-05
**Owner:** Angela Petkovska
**References:** form-mockup.png, landing-mockup.png
