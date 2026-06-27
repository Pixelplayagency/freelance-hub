# PixelFlow — Web Branding & Design System

> Internal task-management workspace by **PixelPlay Agency**.
> Source of truth: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/*`.
> System: **shadcn/ui "Rose" theme** on **Zinc** neutrals, Tailwind v4 (`@theme inline`), color space **OKLCH**.

---

## 1. Brand

| | |
|---|---|
| **Product name** | PixelFlow |
| **Owner** | PixelPlay Agency |
| **Tagline** | "Manage your work with clarity" |
| **Voice** | Clean, professional, calm, efficient |
| **Logo mark** | Clipboard/task icon, white stroke, inside a rounded primary-rose square (`w-9 h-9 rounded-lg`) |
| **Footer** | © PixelPlay Agency 2026 |

---

## 2. Color Palette

Colors are authored in **OKLCH**. Hex equivalents below are for design tools / external branding use.

### Brand / Primary
| Token | OKLCH | Hex (approx) | Use |
|---|---|---|---|
| `--primary` | `oklch(0.585 0.233 13.3)` | **#E11D48** (rose-600) | Buttons, links, active states, brand accents |
| `--primary-foreground` | `oklch(0.969 0.015 12.422)` | **#FFF1F2** | Text/icons on primary |
| `--ring` | `oklch(0.585 0.233 13.3)` | **#E11D48** | Focus rings |
| `--accent` | `oklch(0.975 0.01 13)` | **#FDF2F4** | Light rose tint backgrounds |
| `--accent-foreground` | `oklch(0.585 0.233 13.3)` | **#E11D48** | Text on accent tint |

### Neutrals (Zinc scale)
| Token | OKLCH | Hex (approx) | Use |
|---|---|---|---|
| `--background` | `oklch(1 0 0)` | **#FFFFFF** | Page background |
| `--foreground` | `oklch(0.141 0.005 285.8)` | **#09090B** (zinc-950) | Primary text |
| `--card` / `--popover` | `oklch(1 0 0)` | **#FFFFFF** | Card / menu surfaces |
| `--secondary` / `--muted` | `oklch(0.967 0.001 286.4)` | **#F4F4F5** (zinc-100) | Subtle fills, hover bg |
| `--muted-foreground` | `oklch(0.552 0.016 285.9)` | **#71717A** (zinc-500) | Secondary / helper text |
| `--border` / `--input` | `oklch(0.922 0.004 286.3)` | **#E4E4E7** (zinc-200) | Borders, dividers, input outlines |

### Feedback
| Token | OKLCH | Hex (approx) | Use |
|---|---|---|---|
| `--destructive` | `oklch(0.577 0.245 27.3)` | **#DC2626** (red-600) | Delete, errors |
| `--destructive-foreground` | `oklch(1 0 0)` | **#FFFFFF** | Text on destructive |

### Login left panel (literal value)
- Panel background: **`#1C1C1E`** (near-black charcoal)
- On-dark heading text: white; body text `slate-400`; feature text `slate-300`; footer `slate-600`

### Dark mode (`.dark`)
| Token | OKLCH | Hex (approx) |
|---|---|---|
| `--background` | `oklch(0.141 0.005 285.8)` | **#09090B** |
| `--foreground` | `oklch(0.985 0 0)` | **#FAFAFA** |
| `--card` / `--popover` | `oklch(0.21 0.006 285.9)` | **#18181B** (zinc-900) |
| `--muted` / `--secondary` / `--accent` | `oklch(0.269 0.006 285.9)` | **#27272A** (zinc-800) |
| `--muted-foreground` | `oklch(0.705 0.015 286)` | **#A1A1AA** (zinc-400) |
| `--border` | `oklch(1 0 0 / 10%)` | white @ 10% |
| `--input` | `oklch(1 0 0 / 15%)` | white @ 15% |
| Primary stays | `oklch(0.585 0.233 13.3)` | **#E11D48** |

> Default theme is **light**; system theme detection is disabled (`enableSystem={false}`).

### Sidebar tokens (HSL)
- Light: bg `hsl(0 0% 98%)`, fg `hsl(240 5.3% 26.1%)`, border `hsl(220 13% 91%)`
- Dark: bg `hsl(240 5.9% 10%)`, fg `hsl(240 4.8% 95.9%)`, border `hsl(240 3.7% 15.9%)`

---

## 3. Typography

| Property | Value |
|---|---|
| **Typeface** | **Inter** (Google Fonts, `display: swap`, variable `--font-inter`) |
| **Heading font** | Inter (same family — `--font-heading`) |
| **Fallback stack** | `'Helvetica Neue', Helvetica, system-ui, sans-serif` |
| **Base font size** | **14px** (set on `body`) |
| **Base line-height** | **1.5** |
| **Letter-spacing** | **-0.01em** (global tightening) |
| **Smoothing** | `antialiased` (`-webkit-font-smoothing: antialiased`) |

### Type scale (Tailwind classes in use)
| Role | Class | Size / Line |
|---|---|---|
| Page H1 (auth) | `text-2xl font-bold` | 24px |
| Hero H2 (login panel) | `text-3xl font-bold leading-snug` | 30px |
| Section heading | `text-xl` / `text-lg font-semibold` | 20 / 18px |
| Body (default) | base | 14px |
| Body small / labels | `text-sm` | 14px |
| Helper / muted | `text-sm text-muted-foreground` | 14px |
| Captions / meta | `text-xs` | 12px |
| Brand wordmark | `text-sm font-semibold tracking-tight` | 14px |

**Weights used:** 400 (normal), 500 (`font-medium` — buttons), 600 (`font-semibold` — badges, headings), 700 (`font-bold` — page titles).

---

## 4. Shape, Radius & Elevation

### Border radius — base `--radius: 0.3rem` (4.8px, intentionally tight)
| Token | Calc | Value |
|---|---|---|
| `--radius-sm` | `radius - 3px` | ~1.8px |
| `--radius-md` | `radius - 1px` | ~3.8px |
| `--radius-lg` | `radius` | 4.8px |
| `--radius-xl` | `radius + 4px` | ~8.8px |
| Logo squares | `rounded-lg` | 8px |
| Badges / avatars | `rounded-full` | pill / circle |

### Shadows
| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)` | Cards, top bar |
| `--shadow-card-hover` | `0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04)` | Card hover |
| `--shadow-primary` | `0 4px 14px rgba(225,29,72,.3)` | Primary button glow |

---

## 5. Component Specs

### Button (`size` → height / padding; `text-sm font-medium`, `rounded-md`)
| Size | Height | Padding |
|---|---|---|
| `default` | 40px (`h-10`) | `px-4 py-2` |
| `sm` | 36px (`h-9`) | `px-3` |
| `lg` | 44px (`h-11`) | `px-8` |
| `icon` | 40×40 (`h-10 w-10`) | — |

Variants: `default` (rose, hover 90%), `destructive`, `outline`, `secondary`, `ghost`, `link`. Icons auto-sized to `size-4` (16px).

### Input
`h-10` (40px) · `rounded-md` · `border-input` · `px-3 py-2` · `text-base` (mobile) / `text-sm` (`md:`) · focus ring 2px in `--ring`.

### Badge
`rounded-full` · `px-2.5 py-0.5` · `text-xs font-semibold` · variants: default (rose), secondary, destructive, outline.

### Card / surfaces
White (`--card`) on light, `--shadow-card`, border `--border`, top bar height **56px** (`h-14`).

---

## 6. Motion

| Name | Definition | Use |
|---|---|---|
| `fade-up` | opacity 0→1, `translateY(8px)→0`, **0.35s ease-out** | `.dashboard-page` entrance |
| Transitions | `transition-colors` | Buttons, links, hovers |

---

## 7. Misc UI details

- **Selection:** rose tint `oklch(0.585 0.233 13.3 / 0.15)`
- **Scrollbar:** 5px thin, thumb `oklch(0.82 0 0)` → hover `oklch(0.70 0 0)`, `border-radius: 3px`
- **Accent tint helper:** `.accent-tint` = primary @ 12% opacity (auto-adapts to dark)
- **Prose links:** `#e11d48` underlined
- **Toasts:** Sonner, top-right, `richColors`
- **Layout grid:** sidebar + topbar (56px) shell; content padding `p-3 sm:p-6`

---

## 8. Quick reference (copy-paste)

```
Brand color:   #E11D48  (rose-600)
On-brand text: #FFF1F2
Text:          #09090B  (zinc-950)
Muted text:    #71717A  (zinc-500)
Border:        #E4E4E7  (zinc-200)
Surface fill:  #F4F4F5  (zinc-100)
Background:    #FFFFFF
Destructive:   #DC2626  (red-600)
Dark panel:    #1C1C1E

Font:          Inter (fallback Helvetica Neue)
Base size:     14px / line-height 1.5 / letter-spacing -0.01em
Radius:        0.3rem base (tight)
Button height: 40 / 36 / 44 px (default / sm / lg)
```
