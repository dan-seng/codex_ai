# Design System — JARVIS (Claude-style)

<!-- impeccable:design-schema 1 -->

## Color

### Dark (default)
- `--bg: #0d0d0e` — Deep near-black, warm undertone
- `--bg-elevated: #141416` — Slightly raised surfaces
- `--surface: #1a1a1c` — Cards, bubbles
- `--surface-hover: #212124` — Hover states
- `--border: #2d2d30` — Subtle divides
- `--border-strong: #3d3d42` — Focus rings, active divides
- `--text-1: #eaeaea` — Primary text
- `--text-2: #a0a0a5` — Secondary text
- `--text-3: #6b6b70` — Muted, placeholders
- `--accent: #d97706` — Warm amber (Claude-like)
- `--accent-soft: rgba(217, 119, 6, 0.12)` — Accent backgrounds
- `--accent-strong: #f59e0b` — Accent hover
- `--accent-contrast: #0d0d0e` — Text on accent
- `--danger: #dc2626` — Destructive actions
- `--code-bg: #0a0a0b` — Code blocks
- `--code-head: #121214` — Code headers
- `--shadow: 0 4px 24px rgba(0, 0, 0, 0.4)`
- `--shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.5)`

### Light
- `--bg: #fafafa` — Clean white
- `--bg-elevated: #ffffff` — Raised surfaces
- `--surface: #f5f5f5` — Cards, bubbles
- `--surface-hover: #eeeeee` — Hover states
- `--border: #e5e5e5` — Subtle divides
- `--border-strong: #d4d4d4` — Focus rings, active divides
- `--text-1: #1a1a1a` — Primary text
- `--text-2: #6b6b6b` — Secondary text
- `--text-3: #a3a3a3` — Muted, placeholders
- `--accent: #b45309` — Warm amber (darker for light mode)
- `--accent-soft: rgba(180, 83, 9, 0.1)`
- `--accent-strong: #d97706` — Accent hover
- `--accent-contrast: #ffffff` — Text on accent
- `--danger: #b91c1c`
- `--code-bg: #1a1a1a`
- `--code-head: #242424`
- `--shadow: 0 4px 24px rgba(0, 0, 0, 0.08)`
- `--shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.12)`

## Typography

- **UI Font:** Geist Variable (system-ui fallback)
- **Mono Font:** Geist Mono Variable (SF Mono, Menlo fallback)
- **Scale:**
  - `--text-xs: 0.7rem` — Labels, timestamps
  - `--text-sm: 0.85rem` — UI labels, hints
  - `--text-base: 1rem` — Body, messages
  - `--text-lg: 1.125rem` — Welcome title
  - `--text-xl: 1.5rem` — Page titles
  - `--text-2xl: 2rem` — Hero (unused)
- **Line heights:**
  - `--leading-tight: 1.25` — Headings
  - `--leading-normal: 1.6` — Body text
  - `--leading-relaxed: 1.75` — Message bubbles
- **Weights:**
  - `--weight-normal: 400`
  - `--weight-medium: 500`
  - `--weight-semibold: 600`

## Spacing

- `--space-1: 0.25rem` (4px)
- `--space-2: 0.5rem` (8px)
- `--space-3: 0.75rem` (12px)
- `--space-4: 1rem` (16px)
- `--space-5: 1.25rem` (20px)
- `--space-6: 1.5rem` (24px)
- `--space-8: 2rem` (32px)
- `--space-10: 2.5rem` (40px)
- `--space-12: 3rem` (48px)
- `--space-16: 4rem` (64px)

## Radius

- `--radius-sm: 6px`
- `--radius-md: 10px`
- `--radius-lg: 14px`
- `--radius-xl: 18px`
- `--radius-full: 999px`

## Motion

- `--duration-fast: 120ms`
- `--duration-base: 200ms`
- `--duration-slow: 300ms`
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`
- `--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)`

## Layout

- **Max content width:** 760px
- **Sidebar width:** 280px (collapsed: 56px)
- **Header height:** 56px
- **Composer max height:** 200px

## Shadows

- `--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3)`
- `--shadow: 0 4px 24px rgba(0, 0, 0, 0.4)`
- `--shadow-lg: 0 12px 48px rgba(0, 0, 0, 0.5)`

## Z-index

- `--z-base: 1`
- `--z-dropdown: 20`
- `--z-composer: 30`
- `--z-sidebar: 40`
- `--z-backdrop: 35`
- `--z-toast: 50`
- `--z-modal: 60`

## Breakpoints

- `--bp-sm: 600px`
- `--bp-md: 900px`
- `--bp-lg: 1200px`

## Component Tokens

### Button
- `--btn-height: 40px`
- `--btn-height-sm: 32px`
- `--btn-padding-x: 1rem`
- `--btn-radius: var(--radius-full)`

### Input
- `--input-min-h: 48px`
- `--input-max-h: 200px`
- `--input-padding-x: 1rem`
- `--input-padding-y: 0.75rem`
- `--input-radius: var(--radius-xl)`

### Message Bubble
- `--bubble-radius: 18px`
- `--bubble-radius-tight: 4px`
- `--bubble-padding-x: 1rem`
- `--bubble-padding-y: 0.75rem`
- `--bubble-max-w: 85%`

### Sidebar
- `--sidebar-w: 280px`
- `--sidebar-collapsed-w: 56px`

## Visual Language

**Thesis:** Calm, centered conversation. The interface is a quiet frame — the model's words are the content.

**Own World:** Warm near-black with a single amber accent. Generous whitespace. No borders where spacing works. Subtle elevation only where needed (composer, dropdowns). Type leads; chrome recedes.

**Story:** Visitor opens JARVIS, sees a clean center stage. Types. Gets answer. History lives at the edge, summoned when needed. No dashboard, no clutter.

**First Viewport:** Centered welcome with "What's on your mind?" — four simple prompt chips below. Composer pinned at bottom. Sidebar invisible until summoned.

**Form:** Centered column, max 760px. Hidden sidebar. Floating composer. Streaming bubbles with subtle avatar. Hover-revealed metadata.