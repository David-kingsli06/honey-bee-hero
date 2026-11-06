# HERO SECTION MASTER PROMPT (Direct Implementation Specification)

Use the following detailed specification prompt when asking an AI assistant to build this exact hero section from scratch without any video intro sequence:

---

```markdown
Build a single-viewport, high-end, interactive Hero Section for an artisanal raw honey brand called "Nectar&Co." using Next.js (App Router), TypeScript, and Tailwind CSS.

### 1. Viewport Constraints & Non-Scrollable Layout
- The entire page MUST fit precisely within the browser viewport (`h-screen w-screen overflow-hidden`).
- There must be ZERO page scrolling on desktop screens (`min-h-0`, `flex-1`, and `shrink-0` layout hierarchy).
- Warm, organic color palette:
  - Page background: Soft honey cream (`bg-[#fbf0dc]`) with subtle ambient glowing radial gradients (`bg-amber-200/40`, `bg-orange-200/35`).
  - Text: Deep warm espresso brown (`text-[#2d1808]` and `text-[#3d200a]`).
  - Accents: Golden honey amber (`#d97706`, `#b45309`, `#f59e0b`).

---

### 2. Header (Top Navigation)
- Sleek, compact top bar with `shrink-0`, max-width `max-w-7xl mx-auto px-6 py-4`.
- Left: Brand title only — `Nectar` in `#3d200a` + `&` in `#e28308` + `Co.` in `#3d200a` (`text-xl sm:text-2xl font-black tracking-tight`). Keep it clean without icons or extra badges.
- Center: Navigation links ("Our Hives", "Varieties", "Cold Harvest", "Reviews") with smooth underline hover transitions.
- Right:
  - Secondary action: Circular refresh button `↺ Fresh Batch`.
  - Primary CTA button: Dark espresso pill button `"Order Jars"` with a glowing amber dot and micro-hover elevation.

---

### 3. Left Column: Product Story & Interactive Order Card
Width: `flex-1 max-w-xl flex flex-col justify-center`.

1. **Tag Badge**:
   - Small pill with a pulsing orange dot: `● SPRING BLOOM BATCH • SINGLE ESTATE`.
2. **Typography**:
   - Headline: `Pure drops. Sweeter mornings.` (Large bold serif/sans-serif, with `Sweeter mornings.` highlighted in a warm amber gradient).
   - Subtitle: 2-line description of 100% raw, unheated mountain honey, cold-extracted and coarse-filtered straight from the comb.
3. **Interactive Honey Variety & Jar Selector Card**:
   - Cream-tinted card (`bg-[#f5e4cc]/95 backdrop-blur-md rounded-2xl border border-[#e2cbaf] p-4`).
   - **Harvest Switcher (2 Tabs)**:
     - `🍯 Wildflower Bloom` (Sweet & Floral)
     - `🌲 Dark Forest Amber` (Rich, Pine & Caramel)
     - Clicking tabs dynamically updates the tasting notes and the bee character's speech bubble.
   - **Tasting Notes Profile Box**:
     - Displays an icon (🌸 or 🌲) with the dynamic quote based on the selected harvest.
   - **Jar Size & Live Dynamic Price**:
     - Options: `350g`, `500g`, `1kg`.
     - Active size gets highlighted in amber (`#d97706`).
     - Live price calculation:
       - 350g: \$14.00 (Serves ~18 breakfasts)
       - 500g: \$19.00 (Serves ~28 breakfasts)
       - 1kg: \$32.00 (Serves ~55 breakfasts)
4. **Primary CTAs**:
   - Amber pill button: `"Add Jar to Basket →"` (triggers a top floating toast notification with the selected harvest and size).
   - Outline pill button: `"Say Hi to Bee 🐝"` (cycles speech bubble easter eggs).
5. **Trust Badges Row**:
   - Inline checks: `✓ Raw & Unpasteurized`, `✓ Zero Additives`, `✓ Ethical Alpine Hives`.

---

### 4. Right Column: Hero Visual with 3D Tilt & Interactive Hotspots
Width: `flex-1 w-full flex flex-col items-center justify-center relative`.

1. **Speech Bubble Easter Egg**:
   - Floating speech bubble anchored above the bee with a subtle floating animation (`animate-float-gentle`).
   - Displays quotes from the bee that cycle when clicked or when the user changes honey varieties (e.g., *"Bzz! Made with love from 2,000 mountain flowers!"*, *"Tickles! Hands off my honey jar, hehe 🍯"*).
2. **Hero Image Card & 3D Mouse Tilt**:
   - Displays the hero image (`/hero-bee.jpg` featuring the cute 3D bee character hugging a glass jar of raw golden honey).
   - Dimensions: `aspect-video max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white/70`.
   - **Interactive 3D Perspective Tilt**: Listening to `onMouseMove` over the card to calculate cursor offset and smoothly apply `transform: perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`.
3. **Pulsing Interactive Hotspots (Pins)**:
   - Positioned on top of the image:
     - Hotspot 1 (On Bee): Click to trigger bee speech dialog.
     - Hotspot 2 (On Honey Jar): Tooltip showing *"100% Raw Comb Honey • Unheated"*.
     - Hotspot 3 (On Dipper / Honey): Tooltip showing *"Rich in natural enzymes & propolis"*.
   - Each pin has an animated pinging ring (`animate-ping`) and an icon badge.

---

### 5. Floating Toast Notification
- Fixed at top center: Appears for 2.8s when `"Add Jar to Basket"` is clicked.
- Shows: `🍯 Added to Basket! [Selected Variety] ([Selected Size]) - $[Price]`.

### 6. Technical Deliverables
- Next.js (TypeScript) single page component (`app/page.tsx`).
- Tailwind CSS utility classes throughout.
- Self-contained React state for tabs, jar sizes, 3D tilt coordinates, toast visibility, and speech dialogues.
```
