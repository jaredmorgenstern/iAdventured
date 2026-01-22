import type { PageLoad } from './$types';
import type { User, ComputedStats } from '$lib/types';
import { error } from '@sveltejs/kit';
import citiesData from '$lib/data/cities.json';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

const PALETTE = [
	'#c9a227', '#d4a84b', '#8b7355',
	'#7c6c5c', '#a08060', '#c4a574'
] as const;

function assignColors(visitedCountries: string[]): Map<string, string> {
	return new Map(
		visitedCountries.map((code, i) => [code, PALETTE[i % PALETTE.length]])
	);
}

function computeStats(user: User): ComputedStats {
	const continents = citiesData.continentsByCountry as Record<string, string>;
	const countryNames = citiesData.countryNames as Record<string, string>;
	const capitalCities = (citiesData as { capitalCities: Array<{ city: string; country: string; population: number }> }).capitalCities;

	// Countries visited
	const countriesVisited = user.visitedCountries.length;

	// Continents visited
	const visitedContinents = new Set(
		user.visitedCountries.map(c => continents[c]).filter(Boolean)
	);
	const continentsVisited = visitedContinents.size;

	// Total cities
	const totalCities = user.visitedCities.length;

	// Biggest capitals visited
	const visitedCityNames = new Set(user.visitedCities.map(c => c.city));
	const biggestCapitals = capitalCities
		.filter(c => visitedCityNames.has(c.city))
		.slice(0, 10)
		.map(c => c.city);

	// Most visited country (excluding home country)
	const citiesByCountry = new Map<string, string[]>();
	for (const city of user.visitedCities) {
		if (city.country !== user.homeCountry) {
			const existing = citiesByCountry.get(city.country) || [];
			existing.push(city.city);
			citiesByCountry.set(city.country, existing);
		}
	}
	let mostVisitedCode = '';
	let mostVisitedCities: string[] = [];
	for (const [code, cities] of citiesByCountry) {
		if (cities.length > mostVisitedCities.length) {
			mostVisitedCode = code;
			mostVisitedCities = cities;
		}
	}
	const mostVisitedCountry = {
		name: countryNames[mostVisitedCode] || mostVisitedCode,
		cities: mostVisitedCities
	};

	// Recent adventures (last 5) - only include cities with dates
	const citiesWithDates = user.visitedCities.filter(c => c.date);
	const sortedCities = [...citiesWithDates].sort((a, b) =>
		b.date!.localeCompare(a.date!)
	);
	const recentAdventures = sortedCities.slice(0, 5).map(c => ({
		city: c.city,
		country: countryNames[c.country] || c.country,
		date: c.date!
	}));

	return {
		countriesVisited,
		continentsVisited,
		totalCities,
		biggestCapitals,
		mostVisitedCountry,
		recentAdventures
	};
}

export const load: PageLoad = async ({ params, fetch }) => {
	if (!USERNAME_PATTERN.test(params.username)) {
		throw error(404, 'User not found');
	}

	try {
		const userData = await import(`../../lib/data/users/${params.username}.json`);
		const user: User = userData.default;

		// Load map data at build time
		const mapResponse = await fetch('/countries-110m.json');
		const topology: Topology<{ countries: GeometryCollection }> = await mapResponse.json();
		const geojson = feature(topology, topology.objects.countries);
		const countries = geojson.type === 'FeatureCollection' ? geojson.features : [];

		const stats = computeStats(user);
		const colors = assignColors(user.visitedCountries);

		return { user, stats, colors: Object.fromEntries(colors), countries };
	} catch {
		throw error(404, 'User not found');
	}
};

export const prerender = true;

export function entries() {
	return [{ username: 'jaredmorgenstern' }];
}
