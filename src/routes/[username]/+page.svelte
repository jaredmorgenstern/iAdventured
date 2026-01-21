<script lang="ts">
	import WorldMap from '$lib/components/WorldMap.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.user.name}'s Travel Map | iAdventured</title>
	<meta name="description" content="{data.user.name} has visited {data.stats.countriesVisited} countries across {data.stats.continentsVisited} continents" />
	<meta property="og:title" content="{data.user.name}'s Travel Map" />
	<meta property="og:description" content="{data.stats.countriesVisited} countries visited" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<main>
	<header class="header">
		<h1 class="header-name">{data.user.name}</h1>
		{#if data.user.tagline}
			<p class="header-tagline">{data.user.tagline}</p>
		{/if}
	</header>

	<div class="map-container">
		<WorldMap colors={data.colors} countries={data.countries} />
	</div>

	<div class="stats-grid">
		<div class="stat" style="--i: 0">
			<span class="stat-number">{data.stats.countriesVisited}</span>
			<span class="stat-label">of 195 countries</span>
		</div>

		<div class="stat" style="--i: 1">
			<span class="stat-number">{data.stats.continentsVisited}</span>
			<span class="stat-label">of 7 continents</span>
		</div>

		<div class="stat" style="--i: 2">
			<span class="stat-number">{data.stats.totalCities}</span>
			<span class="stat-label">cities explored</span>
		</div>

		<div class="stat stat--list" style="--i: 3">
			<span class="stat-label">Biggest Cities</span>
			<ol>
				{#each data.stats.biggestCities as city, i}
					<li>{i + 1}. {city}</li>
				{/each}
			</ol>
		</div>

		<div class="stat" style="--i: 4">
			<span class="stat-label">Most Visited</span>
			<span class="stat-country">{data.stats.mostVisitedCountry.name}</span>
			<span class="stat-detail">{data.stats.mostVisitedCountry.cities} cities</span>
		</div>

		<div class="stat stat--list" style="--i: 5">
			<span class="stat-label">Recent Adventures</span>
			<ul>
				{#each data.stats.recentAdventures as adventure}
					<li>{adventure.city}, {adventure.country}</li>
				{/each}
			</ul>
		</div>
	</div>
</main>
