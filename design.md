---
name: Artisanal Harvest
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#414844'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#5e5e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e1dfdb'
  on-secondary-container: '#63635f'
  tertiary: '#3b1f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#56340e'
  on-tertiary-container: '#cd9d6d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#e4e2dd'
  secondary-fixed-dim: '#c8c6c2'
  on-secondary-fixed: '#1b1c19'
  on-secondary-fixed-variant: '#474744'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#f0bd8b'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#623f18'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
  island-padding: 12px 24px
---

## Brand & Style

The design system is centered on a premium, editorial aesthetic that prioritizes high-quality food photography and culinary inspiration. The brand personality is sophisticated yet approachable, evoking the feeling of a high-end lifestyle magazine tailored for the home kitchen. It targets an audience that values wellness, aesthetics, and the ritual of cooking.

The visual style is a blend of **Minimalism** and **Tactile Organicism**. It utilizes expansive off-white spaces to let vibrant food imagery breathe, while incorporating "floating island" navigation and soft, drawer-like containers to create a sense of physical layering. The interface should feel calm, curated, and intentional, avoiding the cluttered density typical of utility-first apps.

## Colors

The palette is rooted in earth tones to reinforce a connection to fresh ingredients.
- **Primary (Forest Green):** Used for primary actions, success states, and brand accents. It conveys freshness and vitality.
- **Secondary (Cream/Off-white):** The foundational surface color. It provides a warmer, more premium feel than pure white, reducing eye strain and mimicking high-quality paper.
- **Neutral (Warm Charcoal):** Used for all primary body text and UI labels to ensure high legibility while maintaining a softer contrast than true black.
- **Accent (Muted Ochre):** Used sparingly for highlights, ratings, or seasonal tags to add warmth.

## Typography

This design system employs a classic high-contrast pairing. **Playfair Display** provides an editorial, authoritative voice for recipe titles and section headers. Its elegant serifs suggest craftsmanship.

**Plus Jakarta Sans** is used for all functional UI elements, ingredient lists, and instructions. Its soft, modern curves complement the organic imagery while ensuring maximum readability across digital screens.

- Use **display-lg** only for top-level hero sections with significant whitespace.
- Use **label-lg** (uppercase) for category tags and metadata like "Prep Time" or "Difficulty" to create clear visual hierarchy.

## Layout & Spacing

The layout philosophy follows a **Fluid-Fixed Hybrid**. On mobile, content uses a single-column "drawer" model where information surfaces are stacked vertically with generous margins. On desktop, a 12-column grid is used with a maximum content width of 1200px to maintain the editorial feel.

**Key Layout Patterns:**
- **Navigation Islands:** The primary navigation should not be pinned to the bottom of the screen but rather "float" as a pill-shaped container with a subtle backdrop blur.
- **Drawer Containers:** Content sections (like recipe details) should emerge as rounded sheets over the background, creating a clear "layered" stack.
- **Circular Framing:** All hero food items must be framed in perfect circles or high-radius "squiggles" to break the rigidity of the grid and mimic the shape of a plate.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Ambient Shadows**.

1. **Base Layer:** The Cream (#F9F7F2) background serves as the canvas.
2. **Surface Layer:** White containers with high corner radius. These should have a very soft, diffused shadow (15% opacity Forest Green tint) to appear as if they are gently resting on the base.
3. **Floating Layer:** Navigation islands and high-priority action buttons use a slightly higher elevation with a more pronounced shadow to indicate they are "closer" to the user.
4. **Backdrop Blurs:** When drawers are expanded, the background should receive a light blur (8-12px) rather than a dark overlay to maintain the "airy" brand feeling.

## Shapes

The shape language is organic and soft.
- **Cards & Drawers:** Use a 1rem (16px) radius to feel substantial yet friendly.
- **Buttons:** Use fully pill-shaped (rounded-full) corners to contrast against the structured text.
- **Imagery:** Primary food photography should be cropped into circles or "stadium" shapes to reinforce the "VitalPlate" culinary metaphor.

## Components

### Buttons
- **Primary:** Forest Green background, White text, pill-shaped. High-contrast and bold.
- **Secondary:** Transparent background, Forest Green border (1px), pill-shaped.
- **Ghost:** No border or background, Forest Green text, used for less critical actions.

### Navigation Island
- A floating pill container at the bottom of the viewport.
- Uses a semi-transparent White background with a heavy backdrop blur.
- Icons should be minimal, weight-matched to the body text.

### Recipe Cards
- Top half: Circular image overflow.
- Bottom half: Playfair Display title with metadata labels in Plus Jakarta Sans.
- No heavy borders; use soft ambient shadows to define the card area.

### Input Fields & Selects
- Subtle Cream-to-White gradients for depth.
- Focus state uses a 2px Forest Green border.
- Labels are always positioned above the field in **label-lg** style.

### Progress & Tags
- Meal planning "chips" use the Tertiary (Ochre) color at 10% opacity with 100% opacity text for a sophisticated, low-contrast look.