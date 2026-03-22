# ServiceCore Design System

## Brand Identity
ServiceCore is built for portable sanitation and field service companies. The design is industrial-modern — professional enough for office managers, rugged enough for field crews.

## Color Palette
| Color | Hex | Tailwind | Usage |
|-------|-----|---------|-------|
| Primary Orange | #f89020 | primary-500 | Buttons, CTAs, active states, accents |
| Primary Light | #fba94c | primary-400 | Hover states, secondary accents |
| Primary Dark | #e07d10 | primary-600 | Active/pressed states |
| Secondary Navy | #0a1f44 | secondary-500 | Sidebar, headers, text headings |
| Secondary Light | #132d5e | secondary-400 | Hover states on dark backgrounds |
| White | #ffffff | white | Card backgrounds, content areas |
| Gray 50 | #f9fafb | gray-50 | Page backgrounds |
| Gray 200 | #e5e7eb | gray-200 | Card borders, dividers |
| Gray 500 | #6b7280 | gray-500 | Secondary text |
| Success Green | #22c55e | green-500 | Success states, approved |
| Warning Amber | #f59e0b | amber-500 | Warnings, experimental badges |
| Error Red | #ef4444 | red-500 | Errors, rejected states |
| Info Blue | #3b82f6 | blue-500 | Information, links |

## Typography
- **Font Family**: Inter (Google Fonts) — `font-display` class
- **Headings**: font-bold to font-black, text-secondary-500, uppercase for section headers
- **Body**: text-sm to text-base, text-gray-600 to text-gray-700
- **Labels**: text-xs font-bold uppercase tracking-wide text-gray-500

## Components
### Cards
`bg-white rounded-xl border border-gray-200` with optional `p-6` or `p-8`

### Buttons
- Primary: `bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-lg`
- Secondary: `bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg`
- Danger: `bg-red-500 hover:bg-red-600 text-white rounded-lg`

### Sidebar
`bg-secondary-500 text-white w-64` with nav items using `hover:bg-white/5`

### Icons
lucide-react throughout — consistent w-4 h-4 or w-5 h-5 sizing

## Border Radius
Rounded: `rounded-lg` (8px) for buttons, `rounded-xl` (12px) for cards

## Shadows
Minimal — `shadow-sm` for elevation, `shadow-2xl` for modals/popups

## Spacing
Tailwind default 4px base unit. Consistent use of `gap-4`, `p-6`, `space-y-6`

## Animation
Minimal and professional — `transition-colors` on interactive elements, no bouncy animations
