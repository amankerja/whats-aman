---
name: Emerald Gateway
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#4aaaef'
  on-tertiary-container: '#003c5e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#cce5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d31'
  on-tertiary-fixed-variant: '#004b73'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-xs:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-desktop: 1.75rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 1.75rem
  space-2xl: 2.5rem
---

## Brand & Style

The design system establishes a high-performance, refined SaaS environment tailored for conversational CRM workflows, WhatsApp API orchestration, and sales team productivity. It communicates technical reliability, operational calm, and seamless velocity. By avoiding the cluttered visual noise standard in legacy CRM consoles, the interface promotes focused engagement and cognitive clarity.

The visual style blends **Corporate Modern** with **Minimalist Precision**:
- **Clarity over ornament:** Generous negative space, structured data density, and lightweight card containers.
- **Calm, operational green:** WhatsApp’s core visual cue is refined from saturated chat tones into a poised, professional emerald spectrum that signals active connections, system health, and completed pipeline events.
- **Tactile efficiency:** Pill-shaped status badges, segmented counters, and rounded interactives convey modern, approachable agility while retaining desktop-grade utility.

## Colors

The palette balances clean slate neutrals with luminous emerald accents:

- **Primary (`#10B981`) & Secondary (`#059669`):** Represents operational stability, successful socket connections, active WhatsApp nodes, and high-priority primary actions (e.g., "Sesi Baru", "Kirim Broadcast"). Subdued tints (`#ECFDF5`, `#D1FAE5`) provide background grounding for badges and active navigation pills.
- **Tertiary (`#0284C7`):** Selected for secondary operational flows, broadcast test suites, analytics accents, and live delivery indicators without conflicting with the emerald baseline.
- **Neutral Palette (`#64748B`, Slate Base):** Canvas background sits on `#F8FAFC`, with `#FFFFFF` for elevated structural cards. Typography scales from intense charcoal `#0F172A` for primary metric numerals down to `#475569` for body copy and `#94A3B8` for secondary metadata and icons.
- **Functional Semantics:**
  - Success/Live: `#10B981` (Online, Connected, Converted)
  - Critical/Disconnected: `#EF4444` (Disconnected session, error logs)
  - Pending/Attention: `#F59E0B` (Awaiting follow-up, queued tasks)

## Typography

The type system is powered by **Plus Jakarta Sans**, offering a balance of geometric precision and friendly humanist curves that keep high-density communication legible and approachable.

- **KPI Metric Displays:** Large metric counters use `headline-xl` and bold weights (`700`), matched with compact uppercase micro-labels (`label-xs`) tracking 0.04em letter-spacing to establish clear hierarchy over raw figures.
- **Section Headers & Module Titles:** Set with crisp, negative letter-spacing (`-0.015em` to `-0.02em`) to ground dashboard cards without requiring excessive separator lines.
- **Chat & Tabular Densities:** WhatsApp message payloads, contact names, and table data stay locked to `body-md` and `body-sm` (13px–14px) with fixed proportional line heights to avoid chat bubble jitter during real-time streaming updates.

## Layout & Spacing

The layout is built on an adaptive multi-pane system rooted in an 8pt spatial grid:

- **Sidebar Rails & Navigation:** A persistent 240px navigation sidebar (collapsible to a 68px compact icon rail) remains docked to the left canvas, keeping core platform destinations accessible.
- **Grid Architecture:** 
  - Standard KPI metric bands leverage a 4-column fluid responsive grid.
  - Multi-session status tables and CRM pipeline clusters occupy full-width cards structured across 12-column subdivisions (`span-3`, `span-4`, or `span-6`).
  - The Inbox split view employs a rigid 360px left contact/thread panel paired with a fluid central chat canvas.
- **Breakpoints:**
  - `Desktop (>= 1280px)`: Fixed sidebar, full 4-tier analytics cards, wide chat viewport.
  - `Tablet (768px - 1279px)`: Sidebar collapses into a slim icon bar; KPI grids collapse to 2 columns; thread list and chat bubble pane adjust to a 50/50 split.
  - `Mobile (< 768px)`: Navigation moves to a slide-over drawer; analytics flow into a vertical single-column stack; chat view transitions to a full-screen view with a back-button pattern.

## Elevation & Depth

Visual hierarchy is maintained through subtle, warm-tinted ambient shadows and crisp hairline borders:

- **Level 0 (Base Canvas):** `#F8FAFC` slate-tinted background. Completely flat without shadow.
- **Level 1 (Card & Module Surfaces):** Pure white (`#FFFFFF`) with a 1px border (`#F1F5F9`) and an ambient, ultra-diffused drop shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.03), 0 1px 2px -1px rgba(15, 23, 42, 0.02)`.
- **Level 2 (Hovered Cards & Interactive Controls):** Modest elevation increase: `0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.03)`.
- **Level 3 (Dropdown Menus, QR Pairing Modals & Overlays):** Stronger elevation floating off the page: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.03)`, bordered with `#E2E8F0`.
- **Tonal Depth:** Active navigation items and status pills forgo hard drop shadows entirely, instead using low-contrast emerald backgrounds (`#ECFDF5`) with soft emerald border outlines (`#A7F3D0`).

## Shapes

The interface balances soft structural cards with fully rounded pill micro-elements:

- **Cards & Data Modules:** Standardized to `12px` (`rounded-lg`) to give charts and dashboard sections a friendly yet orderly structural container.
- **Pills & Status Indicators:** Status badges (`ONLINE`, `TERHUBUNG`, `PRO ANALYTICS`), filter buttons, and primary utility actions use fully rounded pill geometry (`9999px` / `rounded-full`).
- **Inputs & List Items:** Message search fields, text inputs, and table rows use standard `8px` (`rounded-md`) to ensure dense lists and chat bubbles don't waste vertical tracking room.

## Components

### Buttons
- **Primary Action (e.g., "Sesi Baru", "Kirim Broadcast"):** Solid emerald fill (`#10B981`), white bold typography, rounded pill shape, `0.625rem 1.25rem` padding. Subtle brightness increase and slight translateY(-1px) on hover.
- **Secondary / Outline Action (e.g., "Refresh", "Export CSV"):** White background, 1px border `#E2E8F0`, slate typography `#334155`. On hover: border `#CBD5E1`, background `#F8FAFC`.
- **Ghost / Table Action Buttons:** Borderless or subtle line-bordered pill buttons (`Hubungkan`, `Chat`, `Aksi`) sized at `0.375rem 0.75rem` for tight row nesting.

### Badges & Status Pills
- **Connected / Online:** Background `#ECFDF5`, text `#059669`, border `1px solid #A7F3D0`. Includes a 6px glowing green dot.
- **Disconnected / Offline:** Background `#FEF2F2`, text `#DC2626`, border `1px solid #FECACA`.
- **Pro / Analytics Badges:** Background `#F0FDF4`, emerald text `#15803D`, uppercase `label-xs` tracking.

### Cards & KPI Tiles
- Pure `#FFFFFF` surface container, rounded `12px`, border `1px solid #F1F5F9`.
- Header houses the label (muted, uppercase, tracked) alongside a light outline icon container.
- Body displays prominent bold metrics (`#0F172A`), followed by micro-captions or trend badges. Faint thematic watermark icons sit in the card corner at 5% opacity.

### Chat & Messaging Module
- **Conversation List:** Contact rows feature circular avatars, contact names in `600` weight, preview message truncated to 1 line, and unread count badges in bold emerald circles (`#10B981`).
- **Active Chat Bubble:** Inbound messages use `#FFFFFF` on an ultra-light slate pattern; outgoing user messages use `#E7F8F0` or white with an emerald accent indicator.
- **Chat Input Bar:** Pill-shaped, full-width input container with left attachment icons, trailing paperclip, and an emerald circular send button.

### Form Inputs & Dropdowns
- 1px neutral border (`#E2E8F0`) with 8px corner radius. Focused state applies an emerald ring glow: `0 0 0 3px rgba(16, 185, 129, 0.15)` and border `#10B981`.
- Clean select dropdowns with custom chevron icons and subtle slate-50 background tiers.