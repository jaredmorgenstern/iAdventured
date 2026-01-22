<script lang="ts">
	import { geoPath } from 'd3-geo';
	import { geoRobinson } from 'd3-geo-projection';
	import type { Feature, Geometry } from 'geojson';

	let {
		colors,
		countries,
		width = 960,
		height = 500
	}: {
		colors: Record<string, string>;
		countries: Feature<Geometry>[];
		width?: number;
		height?: number;
	} = $props();

	let hoveredId = $state<string | null>(null);

	// Create projection and path generator
	const projection = geoRobinson().fitSize([width, height], { type: 'Sphere' });
	const pathGenerator = geoPath(projection);

	// Separate hovered country for z-order (render last)
	let regularCountries = $derived(
		countries.filter(c => c.id !== hoveredId)
	);
	let hoveredCountry = $derived(
		hoveredId ? countries.find(c => c.id === hoveredId) : null
	);

	// Convert numeric ID to ISO alpha-2 code
	// TopoJSON uses numeric IDs from Natural Earth
	const numericToAlpha2: Record<string, string> = {
		'4': 'AF', '8': 'AL', '12': 'DZ', '20': 'AD', '24': 'AO', '28': 'AG', '32': 'AR',
		'36': 'AU', '40': 'AT', '44': 'BS', '48': 'BH', '50': 'BD', '51': 'AM', '52': 'BB',
		'56': 'BE', '64': 'BT', '68': 'BO', '70': 'BA', '72': 'BW', '76': 'BR', '84': 'BZ',
		'90': 'SB', '96': 'BN', '100': 'BG', '104': 'MM', '108': 'BI', '112': 'BY', '116': 'KH',
		'120': 'CM', '124': 'CA', '132': 'CV', '140': 'CF', '144': 'LK', '148': 'TD', '152': 'CL',
		'156': 'CN', '158': 'TW', '170': 'CO', '174': 'KM', '178': 'CG', '180': 'CD', '184': 'CK',
		'188': 'CR', '191': 'HR', '192': 'CU', '196': 'CY', '203': 'CZ', '204': 'BJ', '208': 'DK',
		'212': 'DM', '214': 'DO', '218': 'EC', '222': 'SV', '226': 'GQ', '231': 'ET', '232': 'ER',
		'233': 'EE', '242': 'FJ', '246': 'FI', '250': 'FR', '262': 'DJ', '266': 'GA', '268': 'GE',
		'270': 'GM', '275': 'PS', '276': 'DE', '288': 'GH', '300': 'GR', '308': 'GD', '320': 'GT',
		'324': 'GN', '328': 'GY', '332': 'HT', '336': 'VA', '340': 'HN', '344': 'HK', '348': 'HU',
		'352': 'IS', '356': 'IN', '360': 'ID', '364': 'IR', '368': 'IQ', '372': 'IE', '376': 'IL',
		'380': 'IT', '384': 'CI', '388': 'JM', '392': 'JP', '398': 'KZ', '400': 'JO', '404': 'KE',
		'408': 'KP', '410': 'KR', '414': 'KW', '417': 'KG', '418': 'LA', '422': 'LB', '426': 'LS',
		'428': 'LV', '430': 'LR', '434': 'LY', '438': 'LI', '440': 'LT', '442': 'LU', '446': 'MO',
		'450': 'MG', '454': 'MW', '458': 'MY', '462': 'MV', '466': 'ML', '470': 'MT', '478': 'MR',
		'480': 'MU', '484': 'MX', '492': 'MC', '496': 'MN', '498': 'MD', '499': 'ME', '504': 'MA',
		'508': 'MZ', '512': 'OM', '516': 'NA', '524': 'NP', '528': 'NL', '540': 'NC', '548': 'VU',
		'554': 'NZ', '558': 'NI', '562': 'NE', '566': 'NG', '578': 'NO', '586': 'PK', '591': 'PA',
		'598': 'PG', '600': 'PY', '604': 'PE', '608': 'PH', '616': 'PL', '620': 'PT', '624': 'GW',
		'626': 'TL', '630': 'PR', '634': 'QA', '642': 'RO', '643': 'RU', '646': 'RW', '682': 'SA',
		'686': 'SN', '688': 'RS', '690': 'SC', '694': 'SL', '702': 'SG', '703': 'SK', '704': 'VN',
		'705': 'SI', '706': 'SO', '710': 'ZA', '716': 'ZW', '724': 'ES', '728': 'SS', '729': 'SD',
		'732': 'EH', '740': 'SR', '748': 'SZ', '752': 'SE', '756': 'CH', '760': 'SY', '762': 'TJ',
		'764': 'TH', '768': 'TG', '780': 'TT', '784': 'AE', '788': 'TN', '792': 'TR', '795': 'TM',
		'800': 'UG', '804': 'UA', '807': 'MK', '818': 'EG', '826': 'GB', '834': 'TZ', '840': 'US',
		'854': 'BF', '858': 'UY', '860': 'UZ', '862': 'VE', '887': 'YE', '894': 'ZM',
		'-99': 'CY'
	};

	function getCountryCode(id: string | number | undefined): string {
		if (id === undefined) return '';
		// Handle both "036" and "36" formats by parsing as integer
		const numId = String(parseInt(String(id), 10));
		return numericToAlpha2[numId] || '';
	}
</script>

<figure role="img" aria-label="World map showing {Object.keys(colors).length} of 195 countries visited">
	<svg
		viewBox="0 0 {width} {height}"
		preserveAspectRatio="xMidYMid meet"
		aria-hidden="true"
	>
		{#each regularCountries as country (country.id)}
			{@const code = getCountryCode(country.id)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<path
				d={pathGenerator(country) || ''}
				fill={colors[code] ?? 'transparent'}
				class="country"
				class:visited={!!colors[code]}
				role="presentation"
				onmouseenter={() => hoveredId = String(country.id)}
				onmouseleave={() => hoveredId = null}
			/>
		{/each}

		{#if hoveredCountry}
			{@const code = getCountryCode(hoveredCountry.id)}
			<path
				d={pathGenerator(hoveredCountry) || ''}
				fill={colors[code] ?? 'transparent'}
				class="country hovered"
				class:visited={!!colors[code]}
			/>
		{/if}
	</svg>
</figure>

<style>
	figure {
		margin: 0;
	}

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

	.country.visited {
		stroke: rgba(255, 255, 255, 0.25);
	}

	.country:hover,
	.country.hovered {
		filter: brightness(1.15) drop-shadow(0 0 8px rgba(201, 162, 39, 0.4));
	}

	@media (hover: none) {
		.country:hover {
			filter: brightness(1.1);
		}
	}
</style>
