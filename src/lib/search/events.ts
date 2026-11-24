// Event search over the season's event list: name, code and location (city, state/province,
// country), with full names for the abbreviations FTC Scout stores (TX → Texas, ON → Ontario).

interface SearchableEvent {
	code: string;
	name: string;
	start: string;
	ongoing: boolean;
	finished: boolean;
	location: { city: string; state: string; country: string };
}

const US_STATES: Record<string, string> = {
	AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
	CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
	HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
	LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
	MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
	NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
	OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', PR: 'Puerto Rico', RI: 'Rhode Island',
	SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
	VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
};

const CA_PROVINCES: Record<string, string> = {
	AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
	NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', ON: 'Ontario', PE: 'Prince Edward Island',
	QC: 'Quebec', SK: 'Saskatchewan'
};

const COUNTRY_ALIASES: Record<string, string> = {
	USA: 'United States America US',
	'United Kingdom': 'UK Great Britain England Scotland Wales',
	Türkiye: 'Turkey',
	'South Korea': 'Korea'
};

const fold = (s: string) =>
	s
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase();

const words = (s: string) => fold(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Full name of a US state / Canadian province code ("TX" → "Texas"); undefined elsewhere. */
export function stateName(country: string, state: string): string | undefined {
	return country === 'USA' ? US_STATES[state] : country === 'Canada' ? CA_PROVINCES[state] : undefined;
}

function locationWords(e: SearchableEvent): string[] {
	const { city, state, country } = e.location;
	return words([city, state, stateName(country, state) ?? '', country, COUNTRY_ALIASES[country] ?? ''].join(' '));
}

/** Events matching every word of `text` (as a word prefix), best matches first, then by date. */
export function searchEvents<E extends SearchableEvent>(events: readonly E[], text: string): E[] {
	const terms = words(text);
	if (terms.length === 0) return [];
	const scored: { e: E; score: number }[] = [];
	for (const e of events) {
		const name = [...words(e.name), fold(e.code)];
		const place = locationWords(e);
		let score = 0;
		let all = true;
		for (const t of terms) {
			if (name.some((w) => w.startsWith(t))) score += 2;
			else if (place.some((w) => w.startsWith(t))) score += 1;
			else {
				all = false;
				break;
			}
		}
		if (all) scored.push({ e, score });
	}
	// Live now, then upcoming soonest first, then past most recent first.
	const phase = (e: E) => (e.ongoing ? 0 : e.finished ? 2 : 1);
	return scored
		.sort(
			(a, b) =>
				b.score - a.score ||
				phase(a.e) - phase(b.e) ||
				(phase(a.e) === 2 ? b.e.start.localeCompare(a.e.start) : a.e.start.localeCompare(b.e.start))
		)
		.map((s) => s.e);
}
