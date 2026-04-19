# RV Trust AI ERP — Raycraft Theme Guide
### Applying raycraft.in design system to the entire frontend

> Based on visual analysis of raycraft.in — 18 April 2026

---

## EXTRACTED DESIGN SYSTEM

From the Raycraft website screenshot, here is the complete design token set:

### Color Palette

```
Background (page)   : #F2EFE9   — warm cream, near-white, never pure white
Surface (cards)     : #EAE6DE   — slightly warmer, used for card backgrounds
Surface 2 (hover)   : #E0DBD1   — deeper cream, hover states
Border              : #D0C9BC   — warm light grey, subtle dividers
Border strong       : #B8B0A2   — stronger border for focused states

Text primary        : #1C1810   — deep espresso, almost black with warmth
Text secondary      : #6B6358   — warm medium grey, body copy, captions
Text muted          : #9B9489   — lighter warm grey, placeholders, labels
Text inverse        : #F2EFE9   — cream — on dark/espresso backgrounds

Primary (button)    : #1C1810   — deep espresso/charcoal (same as text primary)
Primary hover       : #2E2720   — slightly lighter espresso on hover
Primary active      : #0E0D0A   — darker on click

Accent              : #1C1810   — no loud accent color; brand uses monochrome
Success             : #3D6B4F   — muted olive green (inferred, not loud)
Warning             : #8B6914   — warm amber (inferred, stays warm)
Danger              : #8B2F2F   — muted warm red (inferred, not neon)
Info                : #2F567A   — muted slate blue (inferred)

White               : #FFFFFF   — pure white (used sparingly, e.g. button text on dark)
```

### Typography

```
Display font  : 'Cormorant Garamond', serif
              — italic, weight 400-600
              — Used for: page titles, hero headings, section titles
              — Style: elegant, editorial, luxury — always italic for display

UI font       : 'Inter', sans-serif  
              — weight 300, 400, 500
              — Used for: body text, nav links, buttons, labels, data tables

Label style   : uppercase, letter-spacing: 0.15em-0.25em, font-weight: 300-400
              — Used for: "AGI FOR INSTITUTIONS", section labels, tags, "SCROLL"
              — This is the Raycraft signature text treatment

Font scale:
  xs    : 11px / 0.6875rem
  sm    : 13px / 0.8125rem  
  base  : 15px / 0.9375rem   (body text — slightly smaller than default 16px)
  lg    : 17px / 1.0625rem
  xl    : 20px / 1.25rem
  2xl   : 26px / 1.625rem
  3xl   : 34px / 2.125rem
  4xl   : 44px / 2.75rem     (section headings)
  5xl   : 58px / 3.625rem    (hero headings — Cormorant italic)
  6xl   : 74px / 4.625rem    (largest display — Cormorant italic)
```

### Spacing, Radius, Shadow

```
Border radius:
  none  : 0px
  sm    : 2px
  md    : 4px
  lg    : 6px
  xl    : 8px
  pill  : 9999px
  (Raycraft uses very subtle rounding — buttons are ~4px, cards ~6px)

Shadows (extremely subtle — the site is nearly shadowless):
  sm   : 0 1px 3px rgba(28, 24, 16, 0.06)
  md   : 0 2px 8px rgba(28, 24, 16, 0.08)
  lg   : 0 4px 16px rgba(28, 24, 16, 0.10)
  none : (most elements have no shadow — rely on borders instead)

Spacing (8px base grid):
  1 = 4px | 2 = 8px | 3 = 12px | 4 = 16px | 5 = 20px | 6 = 24px
  8 = 32px | 10 = 40px | 12 = 48px | 16 = 64px | 20 = 80px | 24 = 96px

Transitions:
  default  : all 0.2s ease
  slow     : all 0.4s ease
  (smooth, never jarring — Raycraft feels calm and unhurried)
```

### Button Styles

```
Primary button:
  background   : #1C1810
  text         : #FFFFFF (or #F2EFE9 cream)
  border       : none
  border-radius: 4px
  padding      : 14px 28px
  font         : Inter, 500, 14px, letter-spacing: 0.04em
  hover        : background #2E2720, subtle scale(1.01)
  icon         : arrow → on right side

Secondary button (outlined):
  background   : transparent
  text         : #1C1810
  border       : 1.5px solid #1C1810
  border-radius: 4px
  padding      : 14px 28px
  font         : Inter, 500, 14px, letter-spacing: 0.04em
  hover        : background #1C1810, text #F2EFE9 (inverts)

Ghost/text button:
  background   : transparent
  text         : #6B6358
  border       : none
  hover        : text #1C1810, underline

Destructive button:
  Same as primary but background: #8B2F2F
```

### Card Styles

```
Default card:
  background   : #EAE6DE
  border       : 1px solid #D0C9BC
  border-radius: 6px
  padding      : 24px
  shadow       : none (rely on border + bg contrast)

Elevated card (hover/interactive):
  background   : #F2EFE9
  border       : 1px solid #B8B0A2
  shadow       : 0 4px 16px rgba(28, 24, 16, 0.10)

Sidebar/nav background:
  background   : #EDE9E1
  border-right : 1px solid #D0C9BC
```

### Decorative Patterns

```
- Thin horizontal rule: border-bottom: 1px solid #D0C9BC, width: 40px (centered)
- Circle/ring motif: thin ring outline, opacity 0.15-0.2, decorative only
- Dot pattern: small scattered dots, opacity 0.3
- "SCROLL" indicator: uppercase tracked text + thin vertical line
- Section label format: uppercase + wide tracking + light weight (font-weight: 300)
```

---

## PART 1 — WEB APP (Next.js) THEME SETUP

---

### STEP W-1 — Tailwind Config & Design Tokens

```
In rv-trust-frontend/apps/web/:

Replace the existing tailwind.config.ts with a complete Raycraft-branded config.
Also set up CSS custom properties for all design tokens.

1. Update tailwind.config.ts:

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Raycraft Brand Palette ──
        cream: {
          DEFAULT: '#F2EFE9',
          50:  '#FAF9F6',
          100: '#F2EFE9',
          200: '#EAE6DE',
          300: '#E0DBD1',
          400: '#D0C9BC',
          500: '#B8B0A2',
          600: '#9B9489',
          700: '#6B6358',
          800: '#3D3830',
          900: '#1C1810',
        },
        espresso: {
          DEFAULT: '#1C1810',
          light:   '#2E2720',
          dark:    '#0E0D0A',
        },
        // ── Semantic tokens ──
        background: '#F2EFE9',
        surface:    '#EAE6DE',
        border:     '#D0C9BC',
        'border-strong': '#B8B0A2',
        'text-primary':   '#1C1810',
        'text-secondary': '#6B6358',
        'text-muted':     '#9B9489',
        // ── Status colors (warm, never neon) ──
        success: { DEFAULT: '#3D6B4F', light: '#EBF3EE', dark: '#2D5239' },
        warning: { DEFAULT: '#8B6914', light: '#F5EDDB', dark: '#6B5010' },
        danger:  { DEFAULT: '#8B2F2F', light: '#F5E6E6', dark: '#6B2323' },
        info:    { DEFAULT: '#2F567A', light: '#E6EEF5', dark: '#23415C' },
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.6875rem', { lineHeight: '1rem' }],
        'sm':   ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.9375rem', { lineHeight: '1.625rem' }],
        'lg':   ['1.0625rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',   { lineHeight: '1.875rem' }],
        '2xl':  ['1.625rem',  { lineHeight: '2.25rem' }],
        '3xl':  ['2.125rem',  { lineHeight: '2.75rem' }],
        '4xl':  ['2.75rem',   { lineHeight: '3.25rem' }],
        '5xl':  ['3.625rem',  { lineHeight: '4rem', letterSpacing: '-0.02em' }],
        '6xl':  ['4.625rem',  { lineHeight: '5rem', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        'widest-2': '0.20em',
        'widest-3': '0.25em',
      },
      borderRadius: {
        'none': '0',
        'sm':   '2px',
        DEFAULT:'4px',
        'md':   '4px',
        'lg':   '6px',
        'xl':   '8px',
        '2xl':  '12px',
        'full': '9999px',
      },
      boxShadow: {
        'sm':  '0 1px 3px rgba(28, 24, 16, 0.06)',
        DEFAULT:'0 2px 8px rgba(28, 24, 16, 0.08)',
        'md':  '0 2px 8px rgba(28, 24, 16, 0.08)',
        'lg':  '0 4px 16px rgba(28, 24, 16, 0.10)',
        'xl':  '0 8px 32px rgba(28, 24, 16, 0.12)',
        'none':'none',
      },
      transitionTimingFunction: {
        'calm': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '400': '400ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config


2. Update src/app/globals.css:

@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --background:      #F2EFE9;
  --surface:         #EAE6DE;
  --surface-2:       #E0DBD1;
  --border:          #D0C9BC;
  --border-strong:   #B8B0A2;

  --text-primary:    #1C1810;
  --text-secondary:  #6B6358;
  --text-muted:      #9B9489;
  --text-inverse:    #F2EFE9;

  --primary:         #1C1810;
  --primary-hover:   #2E2720;
  --primary-active:  #0E0D0A;

  --success:         #3D6B4F;
  --warning:         #8B6914;
  --danger:          #8B2F2F;
  --info:            #2F567A;

  --radius:          4px;
  --radius-lg:       6px;

  --transition:      all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  border-color: var(--border);
}

body {
  background-color: var(--background);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 0.9375rem;
  line-height: 1.625;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Display headings always use Cormorant italic */
h1, h2, .display {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 400;
  letter-spacing: -0.02em;
}

/* Raycraft label style: uppercase + wide tracking */
.label-track {
  font-family: 'Inter', sans-serif;
  font-size: 0.6875rem;
  font-weight: 300;
  letter-spacing: 0.20em;
  text-transform: uppercase;
  color: var(--text-secondary);
}

/* Thin decorative rule (used like a Raycraft divider) */
.ray-rule {
  display: block;
  width: 40px;
  height: 1px;
  background: var(--border-strong);
  margin: 1.5rem auto;
}

/* Scrollbar */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: var(--background); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
```

---

### STEP W-2 — shadcn/ui Component Overrides

```
In rv-trust-frontend/apps/web/src/components/ui/:

After installing shadcn/ui, override the default component styles to match Raycraft.
Run: npx shadcn-ui@latest init  — choose CSS variables mode.

Update components.json:
{
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "stone",
    "cssVariables": true
  }
}

In globals.css, replace the shadcn CSS variable block with:

@layer base {
  :root {
    --background:     28 26 22;       /* cream */
    --foreground:     28 24 16;       /* espresso */
    --card:           234 230 222;    /* surface */
    --card-foreground: 28 24 16;
    --popover:        242 239 233;    /* cream */
    --popover-foreground: 28 24 16;
    --primary:        28 24 16;       /* espresso */
    --primary-foreground: 242 239 233;
    --secondary:      234 230 222;    /* surface */
    --secondary-foreground: 28 24 16;
    --muted:          224 219 209;
    --muted-foreground: 107 99 88;
    --accent:         224 219 209;
    --accent-foreground: 28 24 16;
    --destructive:    139 47 47;
    --destructive-foreground: 242 239 233;
    --border:         208 201 188;
    --input:          208 201 188;
    --ring:           28 24 16;
    --radius:         0.25rem;        /* 4px — Raycraft subtle radius */
  }
}

Now update each shadcn component:

1. src/components/ui/button.tsx — Raycraft button styles:
Replace the buttonVariants cva with:

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-medium tracking-[0.04em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        default:     'bg-[#1C1810] text-[#F2EFE9] hover:bg-[#2E2720] active:bg-[#0E0D0A]',
        outline:     'border border-[#1C1810] bg-transparent text-[#1C1810] hover:bg-[#1C1810] hover:text-[#F2EFE9]',
        ghost:       'bg-transparent text-[#6B6358] hover:text-[#1C1810] hover:bg-[#EAE6DE]',
        destructive: 'bg-[#8B2F2F] text-[#F2EFE9] hover:bg-[#6B2323]',
        link:        'text-[#1C1810] underline-offset-4 hover:underline p-0 h-auto',
        success:     'bg-[#3D6B4F] text-[#F2EFE9] hover:bg-[#2D5239]',
      },
      size: {
        sm:      'h-8 px-4 py-1.5 text-xs',
        default: 'h-11 px-7 py-3.5',
        lg:      'h-13 px-9 py-4 text-base',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

2. src/components/ui/card.tsx — Raycraft card styles:
Update Card className:
  'rounded-[6px] border border-[#D0C9BC] bg-[#EAE6DE] text-[#1C1810]'
Update CardHeader: 'flex flex-col space-y-1 p-6'
Update CardTitle: 'font-display italic text-2xl font-normal leading-none'
Update CardDescription: 'text-[#6B6358] text-sm'
Update CardContent: 'p-6 pt-0'
Update CardFooter: 'flex items-center p-6 pt-0 border-t border-[#D0C9BC] mt-4'

3. src/components/ui/badge.tsx — Raycraft badge styles:
Update badgeVariants:
  default:     'border-transparent bg-[#1C1810] text-[#F2EFE9]'
  secondary:   'border-transparent bg-[#EAE6DE] text-[#6B6358]'
  destructive: 'border-transparent bg-[#F5E6E6] text-[#8B2F2F]'
  outline:     'border-[#D0C9BC] text-[#1C1810] bg-transparent'
  success:     'border-transparent bg-[#EBF3EE] text-[#3D6B4F]'
  warning:     'border-transparent bg-[#F5EDDB] text-[#8B6914]'
Base classes: 'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-[0.06em] uppercase transition-colors'

4. src/components/ui/input.tsx — Raycraft input:
className: 'flex h-10 w-full rounded-[4px] border border-[#D0C9BC] bg-[#F2EFE9] px-3 py-2 text-sm font-sans text-[#1C1810] placeholder:text-[#9B9489] transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:border-[#1C1810] focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50'

5. src/components/ui/select.tsx — update trigger:
className includes: 'border-[#D0C9BC] bg-[#F2EFE9] focus:border-[#1C1810] focus:ring-0'

6. src/components/ui/dialog.tsx — Raycraft modal:
DialogContent: 'bg-[#F2EFE9] border border-[#D0C9BC] shadow-xl rounded-[6px]'
DialogTitle: 'font-display italic text-2xl font-normal text-[#1C1810]'
DialogDescription: 'text-[#6B6358] text-sm'

7. src/components/ui/table.tsx — Raycraft table:
Table wrapper: 'w-full caption-bottom text-sm'
TableHeader: '[&_tr]:border-b [&_tr]:border-[#D0C9BC]'
TableBody: '[&_tr:last-child]:border-0'
TableRow: 'border-b border-[#D0C9BC] transition-colors hover:bg-[#EAE6DE] data-[state=selected]:bg-[#E0DBD1]'
TableHead: 'h-11 px-4 text-left align-middle font-sans text-xs font-medium uppercase tracking-[0.10em] text-[#9B9489]'
TableCell: 'px-4 py-3 align-middle text-[#1C1810]'

8. src/components/ui/separator.tsx:
className: 'shrink-0 bg-[#D0C9BC]'

9. src/components/ui/skeleton.tsx:
className: 'animate-pulse rounded-md bg-[#E0DBD1]'
```

---

### STEP W-3 — App Shell Layout (Sidebar + Header)

```
In rv-trust-frontend/apps/web/src/components/layout/:

Rebuild the entire app shell to match the Raycraft aesthetic.

1. Create src/components/layout/AppShell.tsx:
   The root layout wrapper for all authenticated pages.
   
   Design:
   - Background: #F2EFE9 (full page)
   - Left sidebar: 240px wide, #EDE9E1 background, right border 1px solid #D0C9BC
   - Main content area: takes remaining width, padding 32px
   - No shadows between sidebar and content — border only

2. Create src/components/layout/Sidebar.tsx:
   
   Structure:
   - Top: Raycraft "Rc" logo mark (or RV Trust wordmark) — in Cormorant italic
     Below logo: thin decorative rule (1px, 40px wide, #D0C9BC)
   - Navigation section label: "NAVIGATION" in label-track style
   - Nav items: 
       - Each item: full-width, 40px height, 16px horizontal padding
       - Icon (16px, Lucide) + label text in Inter 400 14px
       - Default: text-[#6B6358] bg-transparent
       - Active:  text-[#1C1810] bg-[#E0DBD1], left border 2px solid #1C1810
       - Hover:   text-[#1C1810] bg-[#EAE6DE]
       - Transition: all 0.15s ease
   - Bottom: user avatar + name + role label + logout button
   
   Nav items by role (role-filtered):
   FACULTY:   Dashboard | Attendance | Marks | Voice Calls | Students
   HOD/DEAN:  + Compliance | Analytics
   COUNSELLOR:Mentorship only
   ADMIN:     All items
   TRUSTEE:   Dashboard only

3. Create src/components/layout/TopBar.tsx:
   
   A slim top bar (48px height) above the main content area:
   - Left: Page title in Cormorant Garamond italic, 24px
   - Right: Institution name (small, label-track style) | User badge | Notification bell
   - Border-bottom: 1px solid #D0C9BC
   - Background: #F2EFE9
   - No shadow

4. Create src/components/layout/PageHeader.tsx:
   
   Reusable page header component:
   Props: title (string), subtitle (string?), actions (ReactNode?)
   
   Design:
   - Title: font-display italic text-4xl text-[#1C1810]
   - Subtitle: label-track style, mt-2, text-[#6B6358]  
   - Thin ray-rule below subtitle
   - Actions aligned to the right
   - Bottom margin: 32px before page content

   Example usage in attendance page:
   <PageHeader
     title="Attendance Intelligence"
     subtitle="Live Absentee Tracking — Today"
     actions={<Button variant="outline" size="sm">Export CSV</Button>}
   />

5. Update src/app/(dashboard)/layout.tsx:
   Wrap all dashboard pages in AppShell + Sidebar + TopBar.
   Pass current route to Sidebar for active state detection.
```

---

### STEP W-4 — Raycraft Data Table (AG Grid Theme)

```
In rv-trust-frontend/apps/web/src/components/tables/:

Create a Raycraft-branded AG Grid wrapper that applies the design system
to all data tables across the product.

1. Create src/components/tables/RaycraftGrid.tsx:
   A wrapper around AG Grid Community that injects the custom theme.
   
   Props:
   - rowData: any[]
   - columnDefs: ColDef[]
   - onRowClick?: (row: any) => void
   - height?: string (default '500px')
   - loading?: boolean

2. Create src/styles/ag-grid-raycraft.css:
   Complete AG Grid theme override matching Raycraft palette.
   
   :root {
     --ag-background-color: #F2EFE9;
     --ag-header-background-color: #EAE6DE;
     --ag-odd-row-background-color: #F2EFE9;
     --ag-even-row-background-color: #F2EFE9;
     --ag-row-hover-color: #EAE6DE;
     --ag-selected-row-background-color: #E0DBD1;
     --ag-border-color: #D0C9BC;
     --ag-header-foreground-color: #9B9489;
     --ag-foreground-color: #1C1810;
     --ag-secondary-foreground-color: #6B6358;
     --ag-font-family: 'Inter', sans-serif;
     --ag-font-size: 13px;
     --ag-row-height: 44px;
     --ag-header-height: 40px;
     --ag-cell-horizontal-padding: 16px;
     --ag-borders: solid 1px;
     --ag-border-radius: 0px;
     --ag-card-radius: 6px;
     --ag-card-shadow: 0 2px 8px rgba(28,24,16,0.08);
     --ag-range-selection-border-color: #1C1810;
     --ag-input-border-color: #D0C9BC;
     --ag-input-focus-border-color: #1C1810;
     --ag-checkbox-checked-color: #1C1810;
   }

   /* Header: uppercase tracked labels */
   .ag-header-cell-text {
     font-size: 11px;
     font-weight: 400;
     letter-spacing: 0.10em;
     text-transform: uppercase;
     color: #9B9489;
   }

   /* Row hover smooth */
   .ag-row {
     transition: background-color 0.15s ease;
     border-bottom: 1px solid #D0C9BC;
   }

   /* Remove default AG Grid chrome */
   .ag-root-wrapper {
     border: 1px solid #D0C9BC;
     border-radius: 6px;
     overflow: hidden;
   }

   .ag-header {
     border-bottom: 1px solid #D0C9BC;
   }

   /* Sort icons */
   .ag-sort-indicator-icon { color: #9B9489; }
   .ag-sort-indicator-icon.ag-sort-ascending-icon,
   .ag-sort-indicator-icon.ag-sort-descending-icon { color: #1C1810; }

3. Apply this CSS in RaycraftGrid.tsx by importing ag-grid-raycraft.css 
   and using className="ag-theme-alpine" on the AgGridReact wrapper.

4. Create common cell renderers in src/components/tables/renderers/:
   
   StatusBadge.tsx:
     Renders status strings as Raycraft badges.
     Maps: 'present'→success, 'absent'→danger, 'pending'→warning, 
           'verified'→success, 'failed'→danger, 'escalated'→danger
   
   PercentageBar.tsx:
     A mini progress bar inside a cell.
     Bar color: <75% → danger, 75-85% → warning, >85% → success
     All using the warm Raycraft status palette.
   
   StudentCell.tsx:
     Photo thumbnail (circle, 28px) + student name + USN below in muted text.
   
   ActionMenu.tsx:
     Three-dot menu using Raycraft ghost button styling.
```

---

### STEP W-5 — Recharts Custom Theme

```
In rv-trust-frontend/apps/web/src/lib/:

Create a Raycraft chart theme for all Recharts visualisations.

1. Create src/lib/chart-theme.ts:

export const RAYCRAFT_COLORS = {
  primary:   '#1C1810',
  secondary: '#6B6358',
  muted:     '#B8B0A2',
  success:   '#3D6B4F',
  warning:   '#8B6914',
  danger:    '#8B2F2F',
  info:      '#2F567A',
  // Palette for multi-series charts (warm, harmonious):
  series: [
    '#1C1810',  // espresso
    '#3D6B4F',  // forest
    '#2F567A',  // slate
    '#8B6914',  // amber
    '#8B2F2F',  // sienna
    '#5C4033',  // mocha
    '#6B6358',  // taupe
  ],
}

export const RAYCRAFT_CHART_DEFAULTS = {
  // CartesianGrid
  gridStroke:       '#D0C9BC',
  gridStrokeDash:   '4 4',
  // Axes
  axisColor:        '#D0C9BC',
  axisTickColor:    '#9B9489',
  axisFontSize:     11,
  axisLetterSpacing:'0.05em',
  // Tooltip
  tooltipBg:        '#F2EFE9',
  tooltipBorder:    '#D0C9BC',
  tooltipText:      '#1C1810',
  tooltipRadius:    4,
  tooltipShadow:    '0 4px 16px rgba(28,24,16,0.10)',
}

2. Create src/components/charts/RaycraftTooltip.tsx:
   Custom Recharts tooltip matching Raycraft card style.
   - Background: #F2EFE9
   - Border: 1px solid #D0C9BC
   - Border-radius: 4px
   - Font: Inter 12px
   - Label in Cormorant italic if it's a date/category
   - Values with appropriate status color
   - Box shadow: 0 4px 16px rgba(28,24,16,0.10)

3. Create src/components/charts/AttendanceTrendChart.tsx using:
   - AreaChart with LinearGradient fill
   - Gradient: from #1C1810 (opacity 0.15) to transparent
   - Line: stroke #1C1810, strokeWidth 1.5 (thin, elegant)
   - Reference lines at 75% and 85%:
     75%: stroke #8B2F2F, strokeDasharray "4 4", strokeWidth 1
     85%: stroke #8B6914, strokeDasharray "4 4", strokeWidth 1
   - Dots: fill #1C1810, r={3}, strokeWidth 0
   - CartesianGrid: stroke #D0C9BC, strokeDasharray "4 4"
   - XAxis/YAxis: tick color #9B9489, font size 11px

4. Create src/components/charts/RaycraftBarChart.tsx:
   - Bars: fill #1C1810, radius [2, 2, 0, 0]
   - Hover fill: #2E2720
   - Bar gap: 4px
   - Background bars (the 'empty' part): fill #EAE6DE

5. Create src/components/charts/DonutChart.tsx:
   - Pie chart with hole (innerRadius 60%, outerRadius 85%)
   - Colors from RAYCRAFT_COLORS.series
   - Center label: Cormorant italic large + Inter small
   - Legend below: each item has a small colored square + label
   - Padding angle: 2 (small gap between segments)
```

---

### STEP W-6 — Feature-Specific Page Styling

```
Apply the Raycraft theme to every feature page. In each feature folder,
update the page.tsx files:

For ALL pages across the web app, apply these conventions:

LAYOUT PATTERN:
  <div className="min-h-screen bg-[#F2EFE9]">
    <PageHeader title="..." subtitle="..." actions={...} />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stat cards */}
    </div>
    <div className="mt-8">
      {/* Main content */}
    </div>
  </div>

STAT CARD PATTERN:
  <div className="rounded-[6px] border border-[#D0C9BC] bg-[#EAE6DE] p-6">
    <p className="label-track mb-3">TOTAL ABSENT TODAY</p>
    <p className="font-display italic text-5xl text-[#1C1810]">42</p>
    <p className="text-sm text-[#6B6358] mt-2">↑ 3 more than yesterday</p>
  </div>

SECTION HEADING PATTERN:
  <div className="mb-6">
    <h2 className="font-display italic text-3xl text-[#1C1810]">Attendance Overview</h2>
    <span className="ray-rule" />
  </div>

TABLE SECTION PATTERN:
  <div className="rounded-[6px] border border-[#D0C9BC] overflow-hidden">
    <div className="px-6 py-4 border-b border-[#D0C9BC] flex items-center justify-between">
      <p className="label-track">STUDENT LIST</p>
      <Button variant="outline" size="sm">Export</Button>
    </div>
    <RaycraftGrid rowData={...} columnDefs={...} height="420px" />
  </div>

EMPTY STATE PATTERN:
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 rounded-full border border-[#D0C9BC] flex items-center 
                    justify-center mb-6">
      <IconName className="w-6 h-6 text-[#B8B0A2]" />
    </div>
    <h3 className="font-display italic text-2xl text-[#6B6358] mb-2">Nothing here yet</h3>
    <p className="text-sm text-[#9B9489] max-w-sm">Description of empty state.</p>
  </div>

FORM SECTION PATTERN:
  <div className="max-w-2xl">
    <div className="space-y-6">
      <div>
        <label className="label-track block mb-2">STUDENT NAME</label>
        <Input placeholder="Enter name..." />
      </div>
    </div>
    <div className="mt-8 flex gap-3">
      <Button>Save Changes</Button>
      <Button variant="outline">Cancel</Button>
    </div>
  </div>

Now update these specific feature pages to apply this language:

1. src/app/(dashboard)/attendance/page.tsx — attendance dashboard
2. src/app/(dashboard)/marks/[courseId]/page.tsx — marks entry
3. src/app/(dashboard)/voice/page.tsx — call queue
4. src/app/(dashboard)/placements/page.tsx — placements CRM
5. src/app/(dashboard)/grievance/page.tsx — grievance console
6. src/app/(dashboard)/compliance/page.tsx — NAAC builder
7. src/app/(dashboard)/page.tsx — trust KPI dashboard
8. src/app/(auth)/login/page.tsx — login page

For the LOGIN PAGE specifically, design it as a Raycraft-style full-screen centered layout:
  - Full page background: #F2EFE9
  - Center card: no card background — just content centered vertically
  - Logo/wordmark at top: "RV Trust" in Cormorant italic, 48px
  - Below: label-track "AI ENGAGEMENT PLATFORM"
  - Thin rule
  - Two SSO buttons (Google Workspace + Microsoft) in outline style
  - Below: thin separator "or"
  - Email + password inputs
  - Sign In button (primary, full width)
  - Very bottom: "© Raycraft Technologies · RV Trust" in muted label-track
```

---

### STEP W-7 — Loading States & Micro-animations

```
In rv-trust-frontend/apps/web/src/:

Add Raycraft-appropriate loading states and transitions throughout.

1. Create src/components/ui/RaycraftSkeleton.tsx:
   Skeleton variants matching the warm cream palette.
   
   Base: bg-[#E0DBD1] animate-pulse rounded-[4px]
   
   Variants:
   - TextLine: h-3 w-full or w-2/3 (for text rows)
   - Heading: h-8 w-48 rounded-[4px] (for display headings)
   - Card: full card shape with inner skeleton rows
   - Row: table row height (44px) with 4 column skeletons
   - Stat: h-16 w-24 (for big numbers)

2. Create src/components/ui/RaycraftSpinner.tsx:
   A minimal spinner matching the brand.
   
   Design: a thin ring (2px border) in #D0C9BC with one quarter in #1C1810,
   animate-spin, 24px default size.
   Never use a colorful spinner — keep it espresso on cream.

3. Add page transitions in src/app/(dashboard)/layout.tsx:
   Use framer-motion (if installed) or CSS transitions.
   
   Page enter animation:
   - opacity: 0 → 1 (300ms ease)
   - translateY: 8px → 0 (300ms ease)
   This is the "calm, unhurried" Raycraft feel.

4. Update all React Query loading states across feature pages:
   Replace any generic spinner with <RaycraftSkeleton /> appropriate to the content.
   - Attendance table loading → 8 skeleton rows
   - Stat cards loading → 6 stat card skeletons
   - Charts loading → rectangular skeleton matching chart dimensions

5. Create src/components/ui/Toast.tsx override:
   Use react-hot-toast or shadcn/ui Toaster with Raycraft styling.
   
   Toast styles:
   - Background: #1C1810 (espresso) — a dark toast on the light page
   - Text: #F2EFE9
   - Success icon: #3D6B4F (warm green)
   - Error icon: #8B2F2F (warm red)
   - Border-radius: 4px
   - No shadow — elegant flat toast
   - Position: bottom-center (editorial feel, not top-right which feels system-y)
   - Duration: 4000ms
```

---

## PART 2 — MOBILE APP (Flutter) THEME SETUP

---

### STEP M-1 — Flutter Theme Definition

```
In rv-trust-frontend/apps/mobile/lib/core/theme/:

Create a complete Flutter ThemeData that mirrors the Raycraft design system.

1. Create lib/core/theme/raycraft_colors.dart:

import 'package:flutter/material.dart';

abstract class RaycraftColors {
  // ── Background & Surface ──
  static const Color background   = Color(0xFFF2EFE9);
  static const Color surface      = Color(0xFFEAE6DE);
  static const Color surface2     = Color(0xFFE0DBD1);
  static const Color surfaceHigh  = Color(0xFFF7F5F1);

  // ── Border ──
  static const Color border       = Color(0xFFD0C9BC);
  static const Color borderStrong = Color(0xFFB8B0A2);

  // ── Text ──
  static const Color textPrimary   = Color(0xFF1C1810);
  static const Color textSecondary = Color(0xFF6B6358);
  static const Color textMuted     = Color(0xFF9B9489);
  static const Color textInverse   = Color(0xFFF2EFE9);

  // ── Brand ──
  static const Color primary       = Color(0xFF1C1810);
  static const Color primaryHover  = Color(0xFF2E2720);
  static const Color primaryActive = Color(0xFF0E0D0A);

  // ── Status ──
  static const Color success       = Color(0xFF3D6B4F);
  static const Color successLight  = Color(0xFFEBF3EE);
  static const Color warning       = Color(0xFF8B6914);
  static const Color warningLight  = Color(0xFFF5EDDB);
  static const Color danger        = Color(0xFF8B2F2F);
  static const Color dangerLight   = Color(0xFFF5E6E6);
  static const Color info          = Color(0xFF2F567A);
  static const Color infoLight     = Color(0xFFE6EEF5);
}

2. Create lib/core/theme/raycraft_text_styles.dart:

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'raycraft_colors.dart';

abstract class RaycraftTextStyles {
  // Display — Cormorant Garamond italic (for page titles, hero)
  static TextStyle displayXL = GoogleFonts.cormorantGaramond(
    fontSize: 48, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic,
    color: RaycraftColors.textPrimary, height: 1.1, letterSpacing: -0.5,
  );
  static TextStyle displayLg = GoogleFonts.cormorantGaramond(
    fontSize: 36, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic,
    color: RaycraftColors.textPrimary, height: 1.15, letterSpacing: -0.3,
  );
  static TextStyle displayMd = GoogleFonts.cormorantGaramond(
    fontSize: 28, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic,
    color: RaycraftColors.textPrimary, height: 1.2,
  );
  static TextStyle displaySm = GoogleFonts.cormorantGaramond(
    fontSize: 22, fontWeight: FontWeight.w400, fontStyle: FontStyle.italic,
    color: RaycraftColors.textPrimary, height: 1.3,
  );

  // UI Text — Inter sans-serif
  static TextStyle bodyLg = const TextStyle(
    fontFamily: 'Inter', fontSize: 17, fontWeight: FontWeight.w400,
    color: RaycraftColors.textPrimary, height: 1.65,
  );
  static TextStyle body = const TextStyle(
    fontFamily: 'Inter', fontSize: 15, fontWeight: FontWeight.w400,
    color: RaycraftColors.textPrimary, height: 1.625,
  );
  static TextStyle bodySm = const TextStyle(
    fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w400,
    color: RaycraftColors.textSecondary, height: 1.5,
  );

  // Label — uppercase tracked (the Raycraft signature)
  static TextStyle label = const TextStyle(
    fontFamily: 'Inter', fontSize: 11, fontWeight: FontWeight.w300,
    color: RaycraftColors.textMuted, height: 1.4,
    letterSpacing: 2.5,
    // Use .toUpperCase() when rendering — do not set via style
  );

  // Button
  static TextStyle button = const TextStyle(
    fontFamily: 'Inter', fontSize: 14, fontWeight: FontWeight.w500,
    color: RaycraftColors.textInverse, height: 1.4, letterSpacing: 0.5,
  );

  // Caption / metadata
  static TextStyle caption = const TextStyle(
    fontFamily: 'Inter', fontSize: 11, fontWeight: FontWeight.w400,
    color: RaycraftColors.textMuted, height: 1.4,
  );

  // Monospace (for USN, codes, etc.)
  static TextStyle mono = const TextStyle(
    fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: FontWeight.w400,
    color: RaycraftColors.textSecondary, height: 1.5,
  );
}

3. Create lib/core/theme/raycraft_theme.dart:

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'raycraft_colors.dart';
import 'raycraft_text_styles.dart';

ThemeData raycraftTheme() {
  return ThemeData(
    useMaterial3: true,
    scaffoldBackgroundColor: RaycraftColors.background,
    colorScheme: ColorScheme(
      brightness: Brightness.light,
      primary:            RaycraftColors.primary,
      onPrimary:          RaycraftColors.textInverse,
      secondary:          RaycraftColors.surface,
      onSecondary:        RaycraftColors.textPrimary,
      error:              RaycraftColors.danger,
      onError:            RaycraftColors.textInverse,
      background:         RaycraftColors.background,
      onBackground:       RaycraftColors.textPrimary,
      surface:            RaycraftColors.surface,
      onSurface:          RaycraftColors.textPrimary,
      outline:            RaycraftColors.border,
      outlineVariant:     RaycraftColors.borderStrong,
      surfaceVariant:     RaycraftColors.surface2,
      onSurfaceVariant:   RaycraftColors.textSecondary,
    ),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor:  RaycraftColors.background,
      foregroundColor:  RaycraftColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 0,
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      titleTextStyle: TextStyle(
        fontFamily: 'Cormorant Garamond', fontSize: 22,
        fontWeight: FontWeight.w400, fontStyle: FontStyle.italic,
        color: RaycraftColors.textPrimary,
      ),
    ),

    // Elevated Button (Primary)
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor:  RaycraftColors.primary,
        foregroundColor:  RaycraftColors.textInverse,
        elevation: 0,
        shadowColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        textStyle: RaycraftTextStyles.button,
      ),
    ),

    // Outlined Button (Secondary)
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: RaycraftColors.primary,
        side: const BorderSide(color: RaycraftColors.primary, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
        textStyle: RaycraftTextStyles.button.copyWith(color: RaycraftColors.primary),
      ),
    ),

    // Text Button (Ghost)
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: RaycraftColors.textSecondary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        textStyle: RaycraftTextStyles.bodySm,
      ),
    ),

    // Input Decoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: RaycraftColors.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: RaycraftColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: RaycraftColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(4),
        borderSide: const BorderSide(color: RaycraftColors.primary, width: 1.5),
      ),
      hintStyle: RaycraftTextStyles.body.copyWith(color: RaycraftColors.textMuted),
      labelStyle: RaycraftTextStyles.label,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // Card
    cardTheme: CardTheme(
      color: RaycraftColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(6),
        side: const BorderSide(color: RaycraftColors.border),
      ),
      margin: EdgeInsets.zero,
    ),

    // Chip
    chipTheme: ChipThemeData(
      backgroundColor:  RaycraftColors.surface,
      selectedColor:    RaycraftColors.primary,
      labelStyle: RaycraftTextStyles.caption,
      side: const BorderSide(color: RaycraftColors.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    ),

    // Divider
    dividerTheme: const DividerThemeData(
      color:     RaycraftColors.border,
      thickness: 1,
      space:     1,
    ),

    // Bottom Navigation
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor:     RaycraftColors.background,
      selectedItemColor:   RaycraftColors.primary,
      unselectedItemColor: RaycraftColors.textMuted,
      elevation: 0,
      type: BottomNavigationBarType.fixed,
      selectedLabelStyle: TextStyle(fontFamily: 'Inter', fontSize: 11, fontWeight: FontWeight.w500),
      unselectedLabelStyle: TextStyle(fontFamily: 'Inter', fontSize: 11),
    ),

    // SnackBar (Toast)
    snackBarTheme: SnackBarThemeData(
      backgroundColor: RaycraftColors.primary,
      contentTextStyle: RaycraftTextStyles.bodySm.copyWith(color: RaycraftColors.textInverse),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      behavior: SnackBarBehavior.floating,
    ),

    // Page transitions — calm fade + slight slide
    pageTransitionsTheme: const PageTransitionsTheme(
      builders: {
        TargetPlatform.android: FadeUpwardsPageTransitionsBuilder(),
        TargetPlatform.iOS:     CupertinoPageTransitionsBuilder(),
      },
    ),
  );
}

4. Apply in lib/main.dart:
   MaterialApp(
     theme: raycraftTheme(),
     ...
   )
```

---

### STEP M-2 — Reusable Flutter Widgets (Raycraft Style)

```
In rv-trust-frontend/apps/mobile/lib/shared/widgets/:

Create these reusable widgets that apply the Raycraft design system
across the entire mobile app.

1. raycraft_scaffold.dart — base scaffold for all screens:
   - AppBar with Cormorant italic title + optional actions
   - Background: RaycraftColors.background
   - Bottom nav bar (for main tabs)
   - Safe area padding

2. raycraft_card.dart — themed card:
   Props: child, padding, onTap, hasBorder (default true)
   - Container with RaycraftColors.surface background
   - Border: 1px RaycraftColors.border
   - BorderRadius: 6px
   - No elevation shadow (border only)
   - InkWell with splash color RaycraftColors.surface2

3. raycraft_label.dart — the uppercase tracked label:
   Props: text (auto-uppercased), color (default textMuted)
   - Text widget with RaycraftTextStyles.label
   - Automatically uppercases the text

4. raycraft_stat_card.dart — metric card with label + big number:
   Props: label, value, unit (optional), delta (optional), deltaPositive (bool), 
          accentColor (optional, default primary)
   Layout:
   - RaycraftLabel at top
   - Large Cormorant italic value (displayLg)
   - Unit inline (body, textSecondary)
   - Delta below: ↑/↓ arrow + delta text in success/danger color

5. raycraft_section_header.dart:
   Props: title, subtitle (optional)
   - Cormorant italic title (displaySm)
   - Short divider line (40px, 1px, borderStrong color)
   - Subtitle in label style if provided

6. raycraft_status_badge.dart:
   Props: status (String), size (small/medium)
   Status→color mapping:
   - 'present', 'paid', 'verified', 'resolved' → success
   - 'absent', 'failed', 'danger', 'escalated'  → danger
   - 'late', 'pending', 'warning', 'due'        → warning
   - 'excused', 'info', 'acknowledged'          → info
   - default                                    → muted/secondary
   Design: pill shape, uppercase, tracked, 11px Inter

7. raycraft_divider.dart:
   A thin centered 40px decorative rule.
   Container(width: 40, height: 1, color: RaycraftColors.borderStrong)
   Used after section headings, same as the raycraft.in thin line.

8. raycraft_empty_state.dart:
   Props: icon (IconData), title, subtitle, action (Widget optional)
   - Thin circle container (64px) with icon at center
   - Cormorant italic title below (textSecondary, 22px italic)
   - Body text subtitle (textMuted, centered, max width 280px)
   - Optional action button below

9. raycraft_list_tile.dart:
   A Raycraft-styled list tile for any list (attendance records, 
   call history, fee items, etc.)
   Props: leading (Widget), title, subtitle, trailing (Widget), onTap
   - No ListTile Material chrome
   - Clean layout: 64px height, horizontal padding 20px
   - Separator: 1px border-bottom RaycraftColors.border
   - Leading: typically a status dot or icon in a small circle

10. Add all widgets to lib/shared/widgets/index.dart (barrel export)
```

---

### STEP M-3 — Screen-by-Screen Mobile Restyle

```
Apply the Raycraft theme to all mobile screens.
Open each screen file in Cursor and run this prompt for each one:

---
PROMPT (for each screen file):

Restyle this Flutter screen to use the Raycraft design system.

Design rules:
- Page background: RaycraftColors.background (#F2EFE9)
- App bar: no elevation, white/cream background, Cormorant italic title
- All cards: use RaycraftCard widget (surface bg, 1px border, 6px radius, no shadow)
- All headings: Cormorant Garamond italic (use RaycraftTextStyles.displaySm or displayMd)
- Section labels: use RaycraftLabel widget (uppercase + wide tracking)
- Stat numbers: Cormorant italic large (displayLg)
- Body text: Inter, RaycraftTextStyles.body
- Buttons: use ElevatedButton (primary) or OutlinedButton (secondary) — theme applied globally
- Status indicators: use RaycraftStatusBadge
- Dividers: use RaycraftDivider
- Empty states: use RaycraftEmptyState
- Colors: only from RaycraftColors — never hardcode hex values
- No gradients (unless a very subtle cream gradient for the app bar on scroll)
- No loud colors, no neon, no harsh shadows

After restyling:
- Ensure all functional logic is unchanged
- Ensure all Riverpod providers and navigation are unchanged
- Only visual/styling changes

---

Apply this prompt to each of these files:
1. lib/features/auth/screens/login_screen.dart
2. lib/features/timeline/screens/timeline_screen.dart
3. lib/features/attendance/screens/attendance_screen.dart
4. lib/features/attendance/screens/attendance_detail_screen.dart
5. lib/features/fees/screens/fees_screen.dart
6. lib/features/fees/screens/payment_screen.dart
7. lib/features/voice_calls/screens/call_history_screen.dart
8. lib/features/voice_calls/screens/call_detail_screen.dart
9. lib/features/grievance/screens/grievance_screen.dart
10. lib/features/grievance/screens/file_grievance_screen.dart
```

---

## PART 3 — FONT SETUP

---

### STEP F-1 — Web Font Import

```
In rv-trust-frontend/apps/web/:

1. Update src/app/layout.tsx to use Next.js font optimization:

import { Cormorant_Garamond, Inter } from 'next/font/google'

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}

2. Update tailwind.config.ts fontFamily:
  fontFamily: {
    display: ['var(--font-display)', 'Georgia', 'serif'],
    sans:    ['var(--font-sans)', 'system-ui', 'sans-serif'],
  }
```

---

### STEP F-2 — Flutter Font Setup

```
In rv-trust-frontend/apps/mobile/:

1. Add to pubspec.yaml:
   dependencies:
     google_fonts: ^6.1.0

2. In lib/core/theme/raycraft_text_styles.dart:
   Import: import 'package:google_fonts/google_fonts.dart';
   
   All display styles use GoogleFonts.cormorantGaramond(...)
   All UI styles use TextStyle(fontFamily: 'Inter', ...) — load Inter via google_fonts too
   
   Add to lib/main.dart before runApp():
   GoogleFonts.config.allowRuntimeFetching = false; // use bundled fonts offline
   
3. Add Inter as a bundled asset font for offline use (parents on low-end Android):
   Download Inter variable font and add to assets/fonts/Inter.ttf
   Add to pubspec.yaml assets/fonts section.
   
   Inter is the fallback when Google Fonts cannot be fetched.
   Cormorant Garamond can gracefully fall back to 'Georgia' if unavailable offline.
```

---

## PART 4 — QUICK REFERENCE CHEATSHEET

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RAYCRAFT DESIGN CHEATSHEET — for RV Trust AI ERP Frontend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Page background      #F2EFE9    cream-[100]     RaycraftColors.background
Card background      #EAE6DE    cream-[200]     RaycraftColors.surface
Hover state          #E0DBD1    cream-[300]     RaycraftColors.surface2
Border               #D0C9BC    cream-[400]     RaycraftColors.border
Border (focused)     #B8B0A2    cream-[500]     RaycraftColors.borderStrong
Primary text         #1C1810    cream-[900]     RaycraftColors.textPrimary
Secondary text       #6B6358    cream-[700]     RaycraftColors.textSecondary
Muted text           #9B9489    cream-[600]     RaycraftColors.textMuted
Button / CTA         #1C1810    cream-[900]     RaycraftColors.primary
Button text          #F2EFE9    cream-[100]     RaycraftColors.textInverse
Success              #3D6B4F                    RaycraftColors.success
Warning              #8B6914                    RaycraftColors.warning
Danger               #8B2F2F                    RaycraftColors.danger
Info                 #2F567A                    RaycraftColors.info

Display font   → Cormorant Garamond, italic, weight 300-600
UI font        → Inter, weight 300-500  
Labels         → Inter 11px, weight 300, uppercase, letter-spacing 0.20em
Buttons        → Inter 14px, weight 500, letter-spacing 0.04em

Border radius  → 4px (default), 6px (cards), 9999px (pills/badges)
Shadows        → avoid; use 1px border instead
Transitions    → 0.2s cubic-bezier(0.4,0,0.2,1) — calm, never snappy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

*RV Trust AI ERP Theme Guide — Raycraft Design System*
*Version 0.1 · 18 April 2026 · Confidential*
