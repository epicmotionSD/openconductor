# OpenConductor Brand Guidelines

> The identity & compliance layer for AI agents. Trust as infrastructure, orchestration as motion.

These guidelines are derived from the conductor-wave icon ([icon-conductor.svg](icon-conductor.svg)) and the Trust Stack palette codified in [globals.css](../../packages/frontend/src/app/globals.css). They define how the OpenConductor brand should look, sound, and move across product, marketing, and developer surfaces.

---

## 1. Brand essence

**Who:** Trust infrastructure for autonomous agents — on-chain identity (ERC-8004), policy enforcement, risk scoring, and verifiable proof.

**The metaphor:** A conductor coordinates many performers into one coherent performance. OpenConductor coordinates many agents — across protocols, payments, and policies — into one verifiable outcome.

**Three words to anchor every decision:**
- **Orchestrated** — many parts, one motion
- **Verifiable** — every beat leaves a trace
- **Calm** — infrastructure-grade, not loud

---

## 2. The mark

### Anatomy

The conductor-wave icon contains three elements:

| Element | Meaning |
|---|---|
| **Pivot dot** (lower-left) | The fixed point. Identity. The anchor a conductor holds. |
| **Three ascending arcs** | Motion in cadence — downbeat → upbeat → release. Also reads as the Trust Stack progression: Registry → Governor → Underwriter → Proof (compressed to three strokes). |
| **Opacity trail (45% → 75% → 100%)** | Time. The leading arc is the present; the trailing arcs are what's already been verified. |

### Construction

- **Plate:** 80 × 80, `rx="20"` (25% corner radius), filled `#080B12`
- **Strokes:** 6px, `stroke-linecap="round"`, all emanating from the same pivot at `(24, 72)`
- **Gradient:** `linear-gradient(0.05 0.95 → 0.95 0.05)` — bottom-left to upper-right, reinforcing the sweep direction
- **Stops:** `#00FFB2` (neon green) → `#00C2FF` (cyan)

### Clear space

Reserve a margin of **≥ 16% of the plate width** on all sides. At 80px plate, that's 12px of breathing room. Nothing — text, lines, other icons — should enter that zone.

### Minimum sizes

| Surface | Minimum size |
|---|---|
| Favicon | 16 × 16 (trailing arc will fade — acceptable) |
| App icon / nav | 24 × 24 |
| Marketing hero | 96 × 96 |

Below 16px, prefer a **single-stroke variant** (the brightest arc + pivot only) to maintain legibility.

### Do / don't

**Do:**
- Use the gradient as specified (green → cyan, bottom-left → upper-right)
- Place on `#080B12`, `#0F131D`, or pure white (light-mode variant requires inverting the plate to white and darkening the gradient stops)
- Pair with the wordmark "OpenConductor" set in Sora Bold

**Don't:**
- Rotate, mirror, or change the arc count
- Recolor individual arcs separately
- Place on busy photography without a solid backing plate
- Stretch the aspect ratio — the mark is always square

---

## 3. Color system

The palette is defined as CSS custom properties in [globals.css](../../packages/frontend/src/app/globals.css). The hex values below are the canonical reference.

### Core brand

| Token | Hex | HSL | Role |
|---|---|---|---|
| `--primary` | `#00FFB2` | `162 100% 50%` | Primary brand — CTAs, links, focus rings, highlights |
| `--secondary` | `#00C2FF` | `194 100% 50%` | Secondary brand — badges, accents, gradient terminus |
| `--accent` | `#A259FF` | `266 100% 67%` | Tertiary accent — used sparingly for emphasis |

### Surfaces (dark mode is canonical)

| Token | Hex | Role |
|---|---|---|
| `--background` | `#080B12` | Page background |
| `--background-surface` | `#0F131D` | Cards, popovers |
| `--background-elevated` | `#1A1F2C` | Modals, elevated panels |
| `--background-hover` | `#262C3A` | Hover/active states |

### Text

| Token | Hex | Role |
|---|---|---|
| `--foreground` | `#FFFFFF` | Primary text |
| `--foreground-secondary` | `#B8BCC8` | Secondary text |
| `--foreground-muted` | `#6B7280` | Captions, hints |
| `--foreground-disabled` | `#4B5563` | Disabled states |

### Status

| Token | Hex | Role |
|---|---|---|
| `--success` | `#10B981` | Successful verification, attestation passed |
| `--warning` | `#FF9500` | Pending review, policy ambiguity |
| `--destructive` | `#EF4444` | Failure, denied, revoked |

### The signature gradient

```css
background: linear-gradient(135deg, #00FFB2 0%, #00C2FF 100%);
```

This is **the** brand gradient. It appears in the wordmark (`gradient-text` utility), the scrollbar thumb, the conductor mark itself, and gradient borders. Always 135° (bottom-left to upper-right) — never reverse the direction, because it carries the same meaning as the icon's sweep.

---

## 4. Typography

Fonts are loaded via `next/font/google` in [layout.tsx](../../packages/frontend/src/app/layout.tsx).

| Role | Font | Use for |
|---|---|---|
| **Display** | Sora (`var(--font-display)`) | Headings, hero text, wordmark |
| **Body** | Inter | Paragraphs, UI labels, navigation |
| **Mono** | DM Mono (`var(--font-mono)`) | Code, terminal output, contract addresses, hashes |

### Pairing rules

- Headings: `font-display` (Sora) + `font-bold` + `tracking-tight`
- Body: Inter at 16px default, 1.6 line-height
- Code: DM Mono at 14px, no ligatures
- Eyebrow labels: Inter, `text-xs`, `uppercase`, `tracking-widest`, `text-muted-foreground`

### Wordmark

The word **OpenConductor** is always:
- Single token (no space, no hyphen)
- Set in Sora Bold
- Rendered through the `gradient-text` utility when used as a brand mark (header, hero) — solid `#FFFFFF` when used as inline text in dense UI

---

## 5. Motion & visual language

The conductor mark encodes the brand's motion principles. Animation should follow the same grammar:

### Direction

Motion runs **bottom-left → upper-right**, matching the gradient and the baton sweep. Page enters fade up; CTAs slide up-right on hover; hero accents drift along the 135° axis.

### Cadence

Three is the rhythmic unit. When sequencing entrance animations, group elements in threes with staggered delays of **80ms** between them (downbeat → upbeat → release).

### Trail

Opacity trails communicate time and verification:
- `0.45` — historical, attested, settled
- `0.75` — recent, active
- `1.00` — present, live

Use this pattern for activity feeds, attestation logs, and any UI that shows progression over time.

### Easing

- Standard: `cubic-bezier(0.4, 0, 0.2, 1)` (`transition-smooth` utility)
- Entrance: `ease-out`, 600ms
- Glow pulse: 2s `ease-in-out` infinite (`pulse-glow`)

### Glow

Brand-green and brand-cyan glows (`glow-purple`, `glow-blue` utilities — names are historical, colors are current) reinforce the "live signal" feel. Reserve glows for:
- Active CTAs
- Live verification indicators
- The Trust Stack visualization on the homepage

Never glow body text, dense data tables, or anything users read for more than a few seconds.

---

## 6. Voice & tone

OpenConductor talks like an infrastructure engineer who happens to care about regulation. Specific. Verifiable. Quietly confident.

### Principles

- **Lead with mechanism, not metaphor.** Say "ERC-8004 identity record" before "trust layer."
- **Use numbers when you have them.** "4-layer Trust Stack" beats "comprehensive trust infrastructure."
- **Name the standard.** EU AI Act, ERC-8004, MCP, AP2 — drop the references; readers who matter know them.
- **No hype words.** Avoid: *revolutionary, game-changing, seamless, unleash, supercharge, AI-powered.* Prefer: *verifiable, on-chain, attested, insurable.*
- **Active voice, present tense.** "The Registry mints an identity," not "An identity will be minted by the Registry."

### Headline grammar

Short. Concrete noun. One verb if needed. Examples that ship today:

- *The Identity & Compliance Layer for AI Agents*
- *Install MCP servers without the JSON hell*
- *Trust as infrastructure*

### Microcopy

CTA verbs: **Register, Verify, Install, Deploy, Read the spec.** Never *Get started, Learn more, Click here.*

---

## 7. Applications

### Header

- Logo: `icon-conductor.svg` at 32 × 32, left of wordmark
- Wordmark: Sora Bold 24px, `gradient-text` utility
- Background: `bg-background/80 backdrop-blur-md` over the page
- Border-bottom: `border-primary/20`

### Favicon

Single-stroke variant of the mark (or the full mark — both acceptable at 32×32). Plate corner radius scales proportionally (`rx ≈ width × 0.25`).

### Social preview (OG image)

- Dimensions: 1200 × 630
- Background: `#080B12` with subtle grid (`bg-grid-animated` at 4% opacity)
- Mark on left at 200px
- Wordmark + tagline in Sora to the right
- Gradient accent line along the bottom 6px

### Code & terminal

- Background: `#1A1F2C` (`bg-muted`)
- Border: `border-primary/10`
- Font: DM Mono, 14px
- Primary brand `#00FFB2` for keywords, `#00C2FF` for strings, `#B8BCC8` for default text

### Banners

Use [banner-dark.svg](banner-dark.svg) as the dark template; align headings on the right of the mark with `tracking-tight`. The conductor mark sits at 176 × 176 with 92px top/bottom padding on a 1200 × 360 canvas.

---

## 8. File index

| File | Purpose |
|---|---|
| [icon-conductor.svg](icon-conductor.svg) | Canonical brand icon — conductor wave |
| [banner-dark.svg](banner-dark.svg) | Dark-mode banner template |
| [banner-light.svg](banner-light.svg) | Light-mode banner template |
| BRAND_GUIDELINES.md | This document |

---

## 9. Change log

When updating brand assets, log the change here with a date and one-line rationale. Keep the list short — anything older than two pivots is git-log territory.

- **2026-05-16** — Adopted conductor-wave icon. Replaces compass mark and shield. Aligns iconography with the "orchestration" positioning and the Trust Stack palette already deployed on openconductor.ai.
