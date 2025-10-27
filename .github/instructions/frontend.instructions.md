---
applyTo: '**'
---
# GitHunters Frontend - AI Coding Instructions

## Overview
GitHunters is a blockchain-powered bounty platform with a **modern, animated React frontend** built with Vite. The design prioritizes smooth animations, elegant typography, and a cohesive dark/light theme system using CSS variables and Framer Motion.

## Design System Architecture

### Color & Theme System
- **HSL-based CSS variables** in `index.css` enable seamless dark/light mode switching
- Colors defined as `hsl(var(--primary))` in Tailwind config (`tailwind.config.js`)
- Theme controlled by `ThemeContext` with localStorage persistence
- Apply theme classes: `.dark` added to `document.documentElement`

```css
/* Light mode colors use neutral stone tones */
--primary: 0 0% 20.5%;
--background: 0 0% 100%;

/* Dark mode uses green accent palette */
--primary: 120 40% 50%;
--background: 0 0% 8%;
```

### Typography Hierarchy
Three distinct font families create visual interest (see `tailwind.config.js`):
- **`font-aston`** (Aston Script): Brand logo, hero titles - cursive/decorative
- **`font-calligraphic`** (Playfair Display): Section headers - serif elegance
- **`font-sans`** (Inter): Body text, UI components - clean readability

Import fonts in `index.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Aston+Script&display=swap');
```

## Animation Patterns

### Framer Motion Usage
All page-level animations use **Framer Motion** (`framer-motion` package). Key patterns:

1. **Staggered Entry Animations** (see `LandingPage.jsx`):
```jsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 1, delay: 0.3 }}
>
```

2. **Hover Interactions** with scale and shadow:
```jsx
whileHover={{ 
  scale: 1.03, 
  y: -8,
  boxShadow: "0 15px 30px rgba(0,0,0,0.15)"
}}
whileTap={{ scale: 0.98 }}
```

3. **Sequential Reveals** using `setTimeout` and `AnimatePresence`:
```jsx
const [showTitle, setShowTitle] = useState(false)
useEffect(() => {
  const timer = setTimeout(() => setShowTitle(true), 500)
  return () => clearTimeout(timer)
}, [])
```

### Background Animations
`AnimatedGrid.jsx` provides ambient motion for landing pages:
- Radial gradient overlays with different opacity for light/dark modes
- Floating geometric shapes with `y` translation and opacity pulses
- SVG lines with animated `pathLength` and wiggle effects
- Always use `pointer-events-none` and `z-0` to prevent interaction blocking

## Component Architecture

### UI Component Library (shadcn/ui pattern)
Located in `src/components/ui/`, built with **Radix UI primitives**:
- All components use `React.forwardRef` for ref forwarding
- Styling via `cn()` utility (merges Tailwind classes with clsx)
- Variants managed by `class-variance-authority` (CVA) - see `button.jsx`

```jsx
const buttonVariants = cva(
  "inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      }
    }
  }
)
```

### Page Layout Pattern
1. Wrap content in min-h-screen container with background
2. Add `AnimatedGrid` as fixed background layer
3. Apply relative z-index to content (`z-20`)
4. Use `motion.div` wrappers for staggered animations

See `LandingPage.jsx` lines 51-161 for complete example.

### Navigation & Routing
- **HashRouter** used in `App.jsx` for client-side routing (not BrowserRouter)
- `ProtectedRoute.jsx` wraps authenticated routes
- Navbar conditionally hidden on `/` and `/auth` paths
- Context providers wrap entire app: `ThemeProvider` → `AuthProvider` → `Router`

## Development Setup

### Build Commands
```bash
npm run dev      # Vite dev server on port 3000
npm run build    # Production build
npm run preview  # Preview production build
```

### Path Aliases
- `@/` resolves to `src/` (configured in `vite.config.js`)
- Import pattern: `import { cn } from "@/lib/utils"`
- Backend API proxied to `localhost:4000` during dev

### Key Dependencies
```json
"framer-motion": "^10.18.0"     // All animations
"@radix-ui/*": "^1.x"           // Headless UI primitives
"lucide-react": "^0.294.0"      // Icon system
"class-variance-authority": "^0.7.1"  // CVA for variants
"tailwindcss": "^3.x"           // Utility-first CSS
```

## Design Recreation Guidelines

When building similar designs:

1. **Start with theme system**: Copy `index.css` CSS variables and theme context pattern
2. **Set up Tailwind config**: Extend colors to use HSL variables, add custom fonts and animations
3. **Create background component**: Build `AnimatedGrid.jsx` or similar with subtle motion
4. **Build component library**: Start with Button, Card, Badge using shadcn/ui patterns
5. **Add page animations**: Use Framer Motion for entrance/exit with staggered delays
6. **Implement hover states**: Add `whileHover` scale (1.02-1.05) and shadow transitions

### Animation Timing Reference
- **Page entry**: 0.5-1.5s duration, 0-0.5s delay
- **Staggered items**: 0.6s duration, delay = 0.1-0.2s × index
- **Hover**: 0.2s duration with easeOut
- **Tap**: 0.1s duration immediate

### Spacing & Layout
- Container: `max-w-6xl mx-auto` for content
- Card padding: `p-6` for content, `p-6 pt-0` for body
- Grid gaps: `gap-8` for features, `gap-4` for smaller elements
- Rounded corners: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons

## Common Pitfalls to Avoid

1. **Don't use BrowserRouter** - Use HashRouter to avoid routing issues
2. **Don't hardcode colors** - Always use CSS variables via Tailwind (`bg-primary`, not `bg-gray-900`)
3. **Don't skip AnimatePresence** - Required for exit animations with conditional rendering
4. **Don't forget z-index layers** - Background (z-0), grid overlay (z-10), content (z-20), navbar (z-50)
5. **Import fonts before Tailwind** - Google Fonts import must be first line in `index.css`

## File Reference Examples
- **Animation patterns**: `src/pages/LandingPage.jsx` (lines 1-161)
- **Theme switching**: `src/context/ThemeContext.jsx`, `src/components/ThemeToggle.jsx`
- **CVA variants**: `src/components/ui/button.jsx`
- **Background effects**: `src/components/AnimatedGrid.jsx`
- **CSS variables**: `src/index.css` (lines 1-75)
- **Tailwind config**: `tailwind.config.js` (custom fonts, animations, colors)
