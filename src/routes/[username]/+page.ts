import type { PageLoad } from './$types';
import type { User, ComputedStats } from '$lib/types';
import { error } from '@sveltejs/kit';
import citiesData from '$lib/data/cities.json';

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
	const topCities = citiesData.topCitiesByPopulation;

	// Countries visited
	const countriesVisited = user.visitedCountries.length;

	// Continents visited
	const visitedContinents = new Set(
		user.visitedCountries.map(c => continents[c]).filter(Boolean)
	);
	const continentsVisited = visitedContinents.size;

	// Total cities
	const totalCities = user.visitedCities.length;

	// Biggest cities visited (from top world cities)
	const visitedCityNames = new Set(user.visitedCities.map(c => c.city));
	const biggestCities = topCities
		.filter(c => visitedCityNames.has(c.city))
		.slice(0, 10)
		.map(c => c.city);

	// Most visited country (excluding home country)
	const citiesByCountry = new Map<string, number>();
	for (const city of user.visitedCities) {
		if (city.country !== user.homeCountry) {
			citiesByCountry.set(city.country, (citiesByCountry.get(city.country) || 0) + 1);
		}
	}
	let mostVisitedCode = '';
	let mostVisitedCount = 0;
	for (const [code, count] of citiesByCountry) {
		if (count > mostVisitedCount) {
			mostVisitedCode = code;
			mostVisitedCount = count;
		}
	}
	const mostVisitedCountry = {
		name: countryNames[mostVisitedCode] || mostVisitedCode,
		cities: mostVisitedCount
	};

	// Recent adventures (last 5)
	const sortedCities = [...user.visitedCities].sort((a, b) =>
		b.date.localeCompare(a.date)
	);
	const recentAdventures = sortedCities.slice(0, 5).map(c => ({
		city: c.city,
		country: countryNames[c.country] || c.country,
		date: c.date
	}));

	return {
		countriesVisited,
		continentsVisited,
		totalCities,
		biggestCities,
		mostVisitedCountry,
		recentAdventures
	};
}

export const load: PageLoad = async ({ params }) => {
	if (!USERNAME_PATTERN.test(params.username)) {
		throw error(404, 'User not found');
	}

	try {
		const userData = await import(`../../lib/data/users/${params.username}.json`);
		const user: User = userData.default;

		const stats = computeStats(user);
		const colors = assignColors(user.visitedCountries);

		return { user, stats, colors: Object.fromEntries(colors) };
	} catch {
		throw error(404, 'User not found');
	}
};

export const prerender = true;

export function entries() {
	return [{ username: 'jaredmorgenstern' }];
}
