# FitTrack — Official Ocean Breeze Design Tokens

> **Project:** FitTrack · **Version:** 2.0 planning baseline · **Prepared:** 2026-11-18  
> **Status:** Design/specification only; no implementation, live deployment, production security, test pass, medical accuracy review, or third-party asset license is claimed.  
> **Constraints:** 2 developers · 8-week delivery window · MongoDB, Express.js, React.js, Node.js (MERN) · responsive web app.  


## 1. Source palette — exact user-selected hex values
| Token | Color | Intended role |
|---|---|---|
| `brand.stormyTeal` | `#16697A` | Brand, contrast-capable blocks on light surfaces |
| `brand.pacificBlue` | `#489FB5` | Information graphics, decorative blue, selected UI with tested text |
| `brand.skyBlue` | `#82C0CC` | Soft accents, borders, information highlights |
| `brand.alabasterGrey` | `#EDE7E3` | Light surfaces, dark-theme primary foreground |
| `brand.amberGlow` | `#FFA62B` | High-emphasis CTAs and highlights; dark label text |

All five colors are retained exactly. Accessibility and semantic usage require **additional neutral/dark tokens**, not modifying the user's source palette.

## 2. Semantic color tokens (PROPOSED, verify on real UI)
| Semantic token | Proposed value | Intended use |
|---|---|---|
| `--color-canvas` | `#0B2931` | Deep ocean canvas |
| `--color-surface-1` | `#103742` | Navigation/sidebar, cards |
| `--color-surface-2` | `#144854` | Raised cards |
| `--color-primary-text` | `#EDE7E3` | Text on deep ocean canvas |
| `--color-secondary-text` | `#C1D3D6` | Secondary copy; contrast audit required per surface |
| `--color-accent` | `#FFA62B` | Primary action background |
| `--color-accent-text` | `#0B2931` | Primary action text |
| `--color-focus` | `#FFA62B` | High-visibility focus indicator, test component pairs |
| `--color-error` | `#FF8E88` | Feedback plus text/icon, never color alone |
| `--color-success` | `#65D6A5` | Confirmed saves, not speculative changes |
| `--color-info` | `#82C0CC` | Informational status |
| `--color-border` | `#527985` | Visible surface boundary, test nontext contrast |

Normal text targets ≥4.5:1 and large text/UI boundary as applicable to WCAG 2.2 AA. Decorative brand colors **do not** automatically qualify as text colors. Real opacity/overlays affect effective contrast; verify actual rendered pairs. Source: https://www.w3.org/TR/WCAG22/

## 3. Typography
Preferred: **Manrope** for product identity and UI, system sans-serif fallback. Use only licensed/redistributable font artifacts sourced through legitimate channels; never package private font files in documentation. Official font metadata/license: https://github.com/google/fonts/tree/main/ofl/manrope

| UI element | Desktop scale | Mobile scale | Weight |
|---|---:|---:|---:|
| Hero H1 | clamp(2.75rem, 5vw, 5rem) | fluid by clamp | 700–800 |
| H1 | 2rem | 1.75rem | 700 |
| H2 | 1.5rem | 1.375rem | 700 |
| H3 | 1.25rem | 1.125rem | 600–700 |
| Body | 1rem (16px) | 1rem | 400–500 |
| Metadata | 0.875rem | 0.875rem | 500 |
| Numeric stat | 2rem–2.5rem | 1.75rem | 700–800, tabular-nums |

Prefer normal case for content, uppercase only for short labels. Avoid overly thin text weight in long copy (reference site is typographic inspiration, not a literal copy).

## 4. Spacing, grid and layout
8px base layout rhythm with 4px half-step. Containers max width 1280–1440px; narrow reading max 72ch; mobile 16px horizontal padding; tablet 24px, desktop 32px. Card radius 16px, buttons 12px, input 10px; consistent 44px minimum interactive targets, prefer 48px mobile. Focus states visible on keyboard, not solely hover. No horizontal document overflow at 320px.

## 5. CSS and Tailwind implementation scaffold (example only)
```css
:root {
  color-scheme: dark;
  --color-canvas: #0b2931;
  --color-surface-1: #103742;
  --color-surface-2: #144854;
  --color-primary-text: #ede7e3;
  --color-secondary-text: #c1d3d6;
  --color-accent: #ffa62b;
  --color-accent-text: #0b2931;
  --color-focus: #ffa62b;
  --color-success: #65d6a5;
  --color-error: #ff8e88;
  --color-info: #82c0cc;
  --font-ui: "Manrope", ui-sans-serif, system-ui, sans-serif;
}
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
Use project's actual Tailwind version to bind CSS variables. Do not assume a specific undocumented Tailwind major API. Hero/ending viewport sizing belongs in `DESIGN.md`.

## 6. Chart colors and semantics
Series: `#82C0CC`, `#FFA62B`, `#489FB5`; ensure accessible legends and non-color distinctions (line style, markers, labels). Unknown values shown as missing—not zero. Axes and tooltips use text contrast compliant with card surface. Avoid truncated axes without disclosure. All examples in design previews labeled 'illustrative' until backed by API.

## 7. Motion language
Purposeful animation: reveal, hover, button confirmation, progress line draw and 3D user-controlled movement. No animation may block reading, interaction, or route hydration. Reduced-motion preference overrides autoplay/nonessential motion. For 3D playback offer explicit play/pause and a static equivalent.

## 8. Quality gate
Token contrast matrix tested on actual components; keyboard visible focus; no gradient-caused unreadable copy; 200% zoom reflow; numeric labels include units; default plus reduced-motion snapshots; full-screen hero and outro do not trap short screens.
