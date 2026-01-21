# ✨ feat: Personal Travel Dashboard

> A beautiful static web page at `iadventured.com/[username]` showcasing visited countries on an interactive world map with travel statistics.

## Enhancement Summary

**Simplified on:** 2026-01-20
**Based on:** Consensus from DHH-style, Senior Frontend, and YAGNI reviews

### Key Simplifications (Post-Review)
1. **Removed Welsh-Powell** - Simple round-robin color assignment is sufficient
2. **Removed Zod** - TypeScript `satisfies` validates author-controlled data at compile time
3. **Removed state machines** - Static site has no async loading to manage
4. **Merged phases** - From 5 phases to 3 (Setup, Map, Stats+Polish)
5. **Removed CSP headers** - No user input means no XSS vectors
6. **Deferred accessibility table** - Basic ARIA is sufficient for v1
7. **Deferred keyboard map navigation** - Visual display page, not interactive
8. **Fixed D3+Svelte pattern** - Use `$state` + `$effect` for projection, not `$derived`

---

## Overview

Build a "link in bio" style personal travel portfolio featuring:
- Robinson projection world map with visited countries highlighted in antique gold/brass tones
- Countries floating on deep midnight ink background (no container)
- Subtle hover interactions (brightness + glow)
- 6 stats modules in responsive grid layout
- Fully responsive (desktop, tablet, mobile)
- Static site deployment (no backend)

**Target User:** Jared Morgenstern as initial demo.

### Color Palette
```css
:root {
  --bg-deep: #0a0e14;           /* Midnight ink, not pure black */
  --bg-card: #121820;           /* Subtle blue undertone */
  --border-subtle: #1e2a38;     /* Desaturated slate */
  --visited-primary: #c9a227;   /* Antique gold */
  --visited-secondary: #d4a84b; /* Brass highlight */
  --visited-tertiary: #8b7355;  /* Aged leather */
  --text-primary: #e8e2d6;      /* Warm off-white */
  --text-secondary: #9ca3af;    /* Cool gray */
}
```

---

## Technical Approach

### Architecture (Minimal)

```
src/
├── routes/
│   ├── +layout.svelte           # Global layout, dark theme
│   ├── +error.svelte            # Error page (404)
│   └── [username]/
│       ├── +page.svelte         # Dashboard page (stats inlined)
│       └── +page.ts             # Load user data, compute stats
├── lib/
│   ├── components/
│   │   └── WorldMap.svelte      # D3 map component
│   ├── data/
│   │   └── users/
│   │       └── jaredmorgenstern.json
│   └── types.ts                 # TypeScript interfaces
├── app.css                      # Global styles, CSS variables
└── app.html                     # HTML template
static/
└── countries-110m.json          # TopoJSON world map
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | SvelteKit 2.x | Fast, small bundles, great DX |
| UI | Svelte 5 with runes | Modern reactivity model |
| Map | D3.js (tree-shaken) | Only d3-geo + d3-geo-projection (~22KB) |
| Map Data | TopoJSON (world-atlas) | ~30KB compressed, accurate |
| Styling | CSS Variables + Media Queries | Simple, universal support |
| Deployment | Static adapter | Vercel/Netlify/Cloudflare |

### D3 Bundle (Tree-shaken)
```javascript
// ~22KB total instead of ~100KB
import { geoPath } from 'd3-geo';
import { geoRobinson } from 'd3-geo-projection';
import { feature } from 'topojson-client';
```

---

### Data Types (TypeScript only, no Zod)

```typescript
// src/lib/types.ts
export interface User {
  name: string;
  tagline?: string;
  homeCountry: string;
  visitedCountries: string[];
  visitedCities: {
    city: string;
    country: string;
    date: string; // YYYY-MM format
  }[];
}

export interface ComputedStats {
  countriesVisited: number;
  continentsVisited: number;
  totalCities: number;
  biggestCities: string[];
  mostVisitedCountry: { name: string; cities: number };
  recentAdventures: { city: string; country: string; date: string }[];
}
```

### Data Loading

```typescript
// src/routes/[username]/+page.ts
import type { PageLoad } from './$types';
import type { User } from '$lib/types';
import { error } from '@sveltejs/kit';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

export const load: PageLoad = async ({ params }) => {
  if (!USERNAME_PATTERN.test(params.username)) {
    throw error(404, 'User not found');
  }

  try {
    // Dynamic import for static generation
    const userData = await import(`$lib/data/users/${params.username}.json`);
    const user: User = userData.default;

    // Compute stats at build time
    const stats = computeStats(user);
    const colors = assignColors(user.visitedCountries);

    return { user, stats, colors };
  } catch {
    throw error(404, 'User not found');
  }
};

export const prerender = true;
export const entries = () => [{ username: 'jaredmorgenstern' }];
```

### Color Assignment (Simple Round-Robin)

```typescript
// Inline in +page.ts
const PALETTE = [
  '#c9a227', '#d4a84b', '#8b7355',  // Gold/brass tones
  '#7c6c5c', '#a08060', '#c4a574',  // Leather/parchment
] as const;

function assignColors(visitedCountries: string[]): Map<string, string> {
  return new Map(
    visitedCountries.map((code, i) => [code, PALETTE[i % PALETTE.length]])
  );
}
```

This is sufficient because:
- ~6 colors for ~125 visited countries means colors repeat ~20 times
- Adjacent same-color countries are rare and barely noticeable
- Gold variations are close enough to look intentional

---

### D3 + Svelte Integration (Corrected Pattern)

```svelte
<!-- src/lib/components/WorldMap.svelte -->
<script lang="ts">
  import { geoPath } from 'd3-geo';
  import { geoRobinson } from 'd3-geo-projection';
  import type { Feature, FeatureCollection } from 'geojson';

  let {
    countries,
    colors,
    width = 960,
    height = 500
  }: {
    countries: Feature[];
    colors: Map<string, string>;
    width?: number;
    height?: number;
  } = $props();

  // Track hovered country for z-order
  let hoveredId = $state<string | null>(null);

  // Create projection once, update via effect (not $derived)
  let projection = $state(geoRobinson());

  $effect(() => {
    projection.fitSize([width, height], { type: 'Sphere' });
  });

  // Path generator can be derived (cheap operation)
  let pathGenerator = $derived(geoPath(projection));

  // Separate hovered country for z-order (render last)
  let regularCountries = $derived(
    countries.filter(c => c.id !== hoveredId)
  );
  let hoveredCountry = $derived(
    hoveredId ? countries.find(c => c.id === hoveredId) : null
  );
</script>

<figure role="img" aria-label="World map showing {colors.size} of 195 countries visited">
  <svg
    viewBox="0 0 {width} {height}"
    preserveAspectRatio="xMidYMid meet"
    aria-hidden="true"
  >
    {#each regularCountries as country (country.id)}
      <path
        d={pathGenerator(country)}
        fill={colors.get(country.id as string) ?? 'transparent'}
        class="country"
        onmouseenter={() => hoveredId = country.id as string}
        onmouseleave={() => hoveredId = null}
      />
    {/each}

    {#if hoveredCountry}
      <path
        d={pathGenerator(hoveredCountry)}
        fill={colors.get(hoveredCountry.id as string) ?? 'transparent'}
        class="country hovered"
      />
    {/if}
  </svg>
</figure>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
  }

  .country {
    stroke: rgba(255, 255, 255, 0.15);
    stroke-width: 0.5;
    transition: filter 0.15s ease-out;
    cursor: default;
  }

  .country:hover,
  .country.hovered {
    filter: brightness(1.15) drop-shadow(0 0 8px rgba(201, 162, 39, 0.4));
  }

  /* Simpler effect on touch devices */
  @media (hover: none) {
    .country:hover {
      filter: brightness(1.1);
    }
  }
</style>
```

**Key corrections from review:**
- Use `$state` + `$effect` for projection (avoids creating new instances on every update)
- Render hovered country last for proper z-order (drop-shadow doesn't clip)
- Extract `.features` array from TopoJSON FeatureCollection

---

## Implementation Phases

### Phase 1: Setup + Layout

**Tasks:**
- [x] Initialize SvelteKit project with TypeScript
- [x] Configure static adapter
- [x] Set up CSS variables for color system
- [x] Create base layout with dark theme
- [x] Add dynamic route `[username]`
- [x] Create TypeScript interfaces
- [x] Add 404 error page
- [x] Create user JSON data file

**Files to create:**
- `package.json`
- `svelte.config.js`
- `vite.config.ts`
- `tsconfig.json`
- `src/app.html`
- `src/app.css`
- `src/lib/types.ts`
- `src/routes/+layout.svelte`
- `src/routes/+error.svelte`
- `src/routes/[username]/+page.svelte`
- `src/routes/[username]/+page.ts`
- `src/lib/data/users/jaredmorgenstern.json`

**Success criteria:**
- [x] `npm run dev` starts without errors
- [x] Navigating to `/jaredmorgenstern` loads user data
- [x] Navigating to `/nonexistent` shows 404 page
- [x] Dark theme displays correctly
- [x] `npm run build` produces static HTML

---

### Phase 2: World Map

**Tasks:**
- [x] Download TopoJSON from world-atlas CDN
- [x] Create WorldMap.svelte component
- [x] Implement Robinson projection with D3
- [x] Parse TopoJSON to GeoJSON features
- [x] Style unvisited countries (subtle stroke, no fill)
- [x] Style visited countries (gold/brass fills)
- [x] Add hover effect (brightness + glow)
- [x] Handle z-order for hovered country

**Files to create/modify:**
- `static/countries-110m.json`
- `src/lib/components/WorldMap.svelte`
- `src/routes/[username]/+page.ts` (add TopoJSON loading)

**Success criteria:**
- [x] Map renders with Robinson projection
- [x] Countries float on dark background
- [x] Visited countries show gold/brass fills
- [x] Hover brightens country with glow
- [x] Map scales responsively via viewBox

---

### Phase 3: Stats + Polish

**Tasks:**
- [x] Compute all stats in +page.ts
- [x] Add stats grid with inline HTML (no StatCard component needed)
- [x] Implement responsive grid (media queries)
- [x] Add staggered entrance animations
- [x] Add header with name and tagline
- [x] Add meta tags for social sharing
- [ ] Test on multiple devices
- [ ] Run Lighthouse audit

**Files to create/modify:**
- `src/routes/[username]/+page.svelte` (stats grid, header, meta tags)
- `src/lib/data/cities.json` (top 100 cities by population - hardcoded)

**Success criteria:**
- [x] All 6 stats display correctly
- [x] Grid responds to viewport (3→2→1 columns)
- [x] Cards animate in with stagger
- [x] Animations respect prefers-reduced-motion
- [x] Social preview cards work
- [ ] Lighthouse performance >90

---

## Stats Grid (Inline HTML)

```svelte
<!-- In +page.svelte - no separate component needed -->
<div class="stats-grid">
  <div class="stat">
    <span class="stat-number">{stats.countriesVisited}</span>
    <span class="stat-label">of 195 countries</span>
  </div>

  <div class="stat">
    <span class="stat-number">{stats.continentsVisited}</span>
    <span class="stat-label">of 7 continents</span>
  </div>

  <div class="stat">
    <span class="stat-number">{stats.totalCities}</span>
    <span class="stat-label">cities explored</span>
  </div>

  <div class="stat stat--list">
    <span class="stat-label">Biggest Cities</span>
    <ol>
      {#each stats.biggestCities as city, i}
        <li>{i + 1}. {city}</li>
      {/each}
    </ol>
  </div>

  <div class="stat">
    <span class="stat-label">Most Visited</span>
    <span class="stat-country">{stats.mostVisitedCountry.name}</span>
    <span class="stat-detail">{stats.mostVisitedCountry.cities} cities</span>
  </div>

  <div class="stat stat--list">
    <span class="stat-label">Recent Adventures</span>
    <ul>
      {#each stats.recentAdventures as adventure}
        <li>{adventure.city}, {adventure.country}</li>
      {/each}
    </ul>
  </div>
</div>
```

### Responsive Grid (Media Queries)

```css
.stats-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
  padding: 2rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (min-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Staggered Animations

```css
.stat {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 1.5rem;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.4s ease-out forwards;
  animation-delay: calc(var(--i) * 0.05s);
}

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .stat {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

```svelte
{#each stats as stat, i}
  <div class="stat" style="--i: {i}">...</div>
{/each}
```

---

## Acceptance Criteria

### Functional Requirements
- [ ] Dashboard loads at `/[username]`
- [ ] Invalid usernames return 404
- [ ] World map displays in Robinson projection
- [ ] Visited countries filled with gold/brass
- [ ] Unvisited countries show subtle stroke only
- [ ] Hover brightens country
- [ ] All 6 stats display correct data
- [ ] Responsive layout works

### Non-Functional Requirements
- [ ] LCP <2.5s
- [ ] Page weight <500KB
- [ ] JS bundle <100KB
- [ ] Lighthouse perf >90

---

## Dependencies

```json
{
  "dependencies": {
    "d3-geo": "^3.1.0",
    "d3-geo-projection": "^4.0.0",
    "topojson-client": "^3.1.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

**Removed:** Zod (~12KB), Vitest, Testing Library

---

## What Was Removed (and Why)

| Removed | Reason |
|---------|--------|
| Welsh-Powell algorithm | Simple round-robin is sufficient for 6 colors |
| Zod validation | TypeScript validates author-controlled JSON at compile time |
| State machines | Static site has no async loading to manage |
| CSP meta tags | No user input = no XSS vectors |
| Accessibility data table | Defer to v2; basic ARIA is sufficient |
| Keyboard map navigation | Defer to v2; this is a visual display page |
| adjacency.json | Only needed for Welsh-Powell |
| StatCard component | 6 stats can be inline HTML |
| UserDataSource interface | YAGNI - refactor when needed |
| Phase 0 (Infrastructure) | Merged into Phase 1 |
| Vitest/Testing Library | Add when there's logic worth testing |

---

## Fake Data Specification

```json
{
  "name": "Jared Morgenstern",
  "tagline": "Exploring one country at a time",
  "homeCountry": "US",
  "visitedCountries": ["US", "CA", "MX", "GB", "FR", "DE", "IT", "ES", "JP", "..."],
  "visitedCities": [
    { "city": "New York", "country": "US", "date": "2020-01" },
    { "city": "Tokyo", "country": "JP", "date": "2024-03" }
  ]
}
```

**Targets:**
- ~125 countries (64%)
- All major US cities
- ~33% of world's top 100 cities
- 6 of 7 continents

---

## References

- [SvelteKit Documentation](https://svelte.dev/docs/kit)
- [D3 Geo Projections](https://d3js.org/d3-geo/projection)
- [world-atlas TopoJSON](https://github.com/topojson/world-atlas)
- Design document: `docs/plans/2026-01-20-travel-dashboard-design.md`
