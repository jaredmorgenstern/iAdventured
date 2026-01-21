# iAdventured - Personal Travel Dashboard Design

## Overview

A beautiful, static personal travel portfolio page at `iadventured.com/[username]`. Designed as a "link in bio" destination showcasing a world map of visited countries with stats modules below.

## Visual Design

### Layout (top to bottom)
1. **Header** - Name and optional tagline, minimal height
2. **Map** - Hero visualization, ~50-60% of viewport on load
3. **Stats Modules** - Masonry grid of 6 cards

### Color System
| Element | Color |
|---------|-------|
| Background | `#000000` (pure black) |
| Unvisited countries | `#FFFFFF` stroke at 60% opacity, no fill |
| Visited countries (greens) | `#4ADE80`, `#22C55E`, `#16A34A` |
| Visited countries (purples) | `#A78BFA`, `#8B5CF6`, `#7C3AED` |
| Primary text | `#FFFFFF` |
| Secondary text | `#9CA3AF` |
| Card background | `#111111` |
| Card border | `#222222` |

### Typography
- Font family: Inter, Space Grotesk, or similar clean sans-serif
- Name: Large, bold
- Stat numbers: Extra-large, bold
- Labels: Small, light weight, uppercase with tracking

## The Map

### Projection & Rendering
- **Projection**: Robinson (oval, balanced, National Geographic style)
- **Technology**: D3.js with SVG
- **Data**: TopoJSON (Natural Earth, 110m resolution)
- **Container**: None - countries float on black background, no border or ocean fill

### Country Styling
- **Unvisited**: 1px white stroke (`#FFFFFF` at ~60% opacity), transparent fill
- **Visited**: Solid fill with green/purple hue, same subtle stroke
- **Color assignment**: Algorithm ensures adjacent visited countries have contrasting hues (green next to purple, different shades within palettes)

### Interaction
- **Hover**: Country lightens ~15% brightness
- **Transition**: 150ms ease-out
- **Click**: None (purely visual)
- **Cursor**: Default (no pointer)
- Hover works on both visited and unvisited countries

### Sizing
- Desktop: ~90% viewport width, maintains aspect ratio
- Takes ~50-60% of viewport height on load
- Stats visible below fold, inviting scroll

## Stats Modules

### Layout
- Masonry grid with varied card sizes
- Gap: 16-24px
- Cards: Rounded corners (8-12px), dark background, faint border
- Desktop: 3 columns | Tablet: 2 columns | Mobile: 1 column

### Module Specifications

#### 1. Countries Visited (medium)
- Large number: "125"
- Subtext: "of 195 countries"
- Visual: Circular progress ring or percentage "64%"

#### 2. Biggest Cities Visited (tall)
- Header: "Biggest Cities"
- Top 10 cities by population, ranked
- Format: "1. Tokyo · 2. Delhi · 3. Shanghai..."

#### 3. Continents Touched (small)
- Large number: "6"
- Subtext: "of 7 continents"

#### 4. Total Cities Visited (small)
- Large number: "847"
- Subtext: "cities explored"

#### 5. Most-Visited Country - Non-Home (medium)
- Country name: "Japan"
- Subtext: "23 cities visited"
- Excludes user's home country (configurable)

#### 6. Recent Adventures (tall)
- Header: "Recent Adventures"
- Last 5 places visited, most recent first
- Format: City, country, relative date

## Technical Architecture

### Stack
- **Framework**: SvelteKit
- **Map**: D3.js
- **Deployment**: Static adapter (Vercel, Netlify, or any static host)
- **Data**: JSON files, computed at build time

### Project Structure
```
src/
  routes/
    [username]/+page.svelte    # Main dashboard
    [username]/+page.ts        # Loads user data
  lib/
    components/
      Map.svelte               # D3 map component
      StatCard.svelte          # Reusable module card
      CountriesVisited.svelte
      BiggestCities.svelte
      ContinentsTouched.svelte
      TotalCities.svelte
      MostVisitedCountry.svelte
      RecentAdventures.svelte
    data/
      jaredmorgenstern.json    # User travel data
      countries.json           # Country metadata
      cities.json              # City data with populations
    utils/
      mapColors.ts             # Adjacent color algorithm
  app.css                      # Global styles
static/
  world-110m.json              # TopoJSON map data
```

### User Data Format
```json
{
  "name": "Jared Morgenstern",
  "tagline": "Exploring the world",
  "homeCountry": "USA",
  "visitedCountries": ["USA", "JPN", "FRA", "GBR", "..."],
  "visitedCities": [
    { "city": "Tokyo", "country": "JPN", "date": "2024-03" },
    { "city": "Paris", "country": "FRA", "date": "2023-11" }
  ]
}
```

### Fake Data for Demo
- ~125 countries visited (64%)
- All major US cities
- ~33% of top world cities by population
- 6 of 7 continents

## Responsive Behavior

| Breakpoint | Map | Modules |
|------------|-----|---------|
| Desktop (1024px+) | 90% width | 3-column masonry |
| Tablet (768-1023px) | Full width with padding | 2-column masonry |
| Mobile (<768px) | Full width | Single column stack |

## Performance Considerations
- TopoJSON compression for smaller map data
- Slightly simplified country boundaries
- Static generation - no runtime API calls
- Minimal bundle size (Svelte advantage)
