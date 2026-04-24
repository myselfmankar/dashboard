# Notivo Dashboard — Design System

> Source of truth for all Stitch-generated screens and React implementation.
> Updated: April 2026

---

## Brand Identity

| Property | Value |
|----------|-------|
| Product | Notivo — Smart Pen Analytics Platform |
| Domain | EdTech / Student Analytics / B2B SaaS |
| Vibe | Professional, data-dense, minimal, clean |
| Audience | School administrators, teachers, parents |

---

## Color Palette

### Primary
| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Brand / Accent | Notivo Orange | `#F47B20` | CTAs, active nav, highlights, primary actions |
| Sidebar / Dark | Navy | `#1A1A1A` | Sidebar background, dark surfaces |

### Semantic
| Role | Hex | Usage |
|------|-----|-------|
| Success | `#22c55e` | Active status, good scores, positive trends |
| Warning | `#f59e0b` | Watch items, fair scores, caution indicators |
| Error | `#ef4444` | Critical alerts, at-risk students, danger |
| Info | `#3b82f6` | Informational badges, links, neutral highlights |

### Neutral (Slate Scale)
| Token | Hex | Usage |
|-------|-----|-------|
| s50 | `#faf9f7` | Page background |
| s100 | `#f1f5f9` | Card borders, secondary backgrounds |
| s200 | `#e2e8f0` | Borders, dividers |
| s400 | `#94a3b8` | Placeholder text, disabled |
| s500 | `#64748b` | Secondary text, labels |
| s700 | `#334155` | Primary body text |
| s800 | `#1e293b` | Headings, strong text |
| s900 | `#111110` | Page titles, darkest text |

### Heatmap Risk Scale
| Risk Level | Color | Background |
|------------|-------|------------|
| 0 — On Track | `#22c55e` | `#f0fdf4` |
| 1 — Watch | `#f59e0b` | `#fefce8` |
| 2 — Needs Help | `#f97316` | `#fff7ed` |
| 3 — At Risk | `#ef4444` | `#fef2f2` |
| 4-5 — Critical | `#ef4444` (pulsing) | `#ef4444` solid |

---

## Typography

| Role | Font Family | Weight | Size | Tracking |
|------|-------------|--------|------|----------|
| Page Titles | Anton | 400 | 20px | 0.06em |
| Section Titles | Cormorant Garamond | 600-700 | 15-18px | 0.01em |
| Body Text | Plus Jakarta Sans | 400-600 | 12-14px | normal |
| Monospace / Meta | DM Mono | 400-500 | 9-11px | 0.04-0.2em |

### Scale
- **xs**: 10px (badges, metadata)
- **sm**: 12px (table cells, secondary text)
- **base**: 14px (body text)
- **lg**: 18px (section headings)
- **xl**: 20px (page titles)
- **2xl**: 24px (metric values)
- **3xl**: 30px (hero numbers)

---

## Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Tight gaps (icon-text) |
| 2 | 8px | Small gaps |
| 3 | 12px | Card internal gaps |
| 4 | 16px | Standard padding |
| 5 | 20px | Section padding |
| 6 | 24px | Large card padding |
| 8 | 32px | Section spacing |

---

## Border Radius

| Element | Value |
|---------|-------|
| Small elements (badges, pills) | 6px |
| Buttons, inputs | 10px |
| Cards, panels | 16px |
| Large cards | 20px |
| Circular (avatars) | 50% |
| Pill (status badges) | 99px |

---

## Elevation / Shadows

| Level | Value | Usage |
|-------|-------|-------|
| None | `none` | Flat elements |
| sm | `0 1px 3px rgba(0,0,0,0.06)` | Cards at rest |
| md | `0 4px 12px rgba(0,0,0,0.08)` | Cards on hover |
| lg | `0 4px 40px rgba(0,0,0,0.10)` | Modals, slide panels |
| xl | `0 24px 60px rgba(0,0,0,0.18)` | Dialogs |

---

## Layout

### Desktop (1440px)
- **Sidebar**: 210px fixed, navy background
- **Header**: Sticky, white, 56px height
- **Content**: Fluid, max-width contained, 20px padding
- **Right Panel** (teacher view): 256px, optional

### Tablet (768px)
- **Sidebar**: Drawer mode (hidden, slide-in)
- **Content**: Full width, 16px padding
- **Grids**: 2-column max

### Mobile (320px)
- **Sidebar**: Drawer with backdrop
- **Content**: Single column, 12px padding
- **Tables**: Horizontal scroll or card layout

---

## Component Patterns

### Metric Card
- White background, 1px s200 border, 16px radius
- Icon container: 40×40px, rounded-xl, tinted background
- Value: Anton font, 24px
- Label: DM Mono, 10px, uppercase, widest tracking
- Trend: 10px, green (up) or red (down) with arrow icon

### Data Table
- Header: DM Mono 9px, uppercase, s400, letter-spacing 0.12em
- Rows: 10px vertical padding, s50 hover
- Status badges: Pill-shaped, semantic colors
- Sortable columns: Caret indicator

### Heatmap Grid
- 8-column grid (desktop), 5-column (mobile)
- Square cells, 1px gap
- Risk-level color coding
- Student first name + score % per cell
- Click → detail panel slide-in

### Alert Feed
- Orange gradient background (intelligence section)
- Severity-coded left dot (red/amber)
- DM Mono context line
- "LIVE" pulse badge

### Chart Cards
- White card wrapper
- Cormorant Garamond section title
- recharts for standard (bar, pie, donut)
- Plotly for complex analytics
- Legend below or right-aligned
