export interface User {
	name: string;
	tagline?: string;
	homeCountry: string;
	visitedCountries: string[];
	visitedCities: {
		city: string;
		country: string;
		date: string;
	}[];
}

export interface ComputedStats {
	countriesVisited: number;
	continentsVisited: number;
	totalCities: number;
	biggestCapitals: string[];
	mostVisitedCountry: { name: string; cities: string[] };
	recentAdventures: { city: string; country: string; date: string }[];
}
