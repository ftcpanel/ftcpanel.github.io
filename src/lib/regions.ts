// FTC Scout region options (FIRST regions; they double as event `regionCode`s) with readable names,
// and the nation each belongs to.

import type { RegionOption } from '#lib/api/gql/graphql.ts';

/** Sub-national FIRST regions. Two-letter codes are whole countries (named via Intl). */
const SUBREGIONS: Partial<Record<RegionOption, string>> = {
	CAAB: 'Alberta', CABC: 'British Columbia', CANL: 'Newfoundland and Labrador', CAON: 'Ontario', CAQC: 'Quebec',
	USAK: 'Alaska', USAL: 'Alabama', USAR: 'Arkansas', USAZ: 'Arizona', USCA: 'California',
	USCALA: 'California – Los Angeles', USCALS: 'California – LA South', USCANO: 'Northern California',
	USCASD: 'California – San Diego', USCHS: 'Chesapeake', USCO: 'Colorado', USCT: 'Connecticut', USDE: 'Delaware',
	USFL: 'Florida', USGA: 'Georgia', USHI: 'Hawaii', USIA: 'Iowa', USID: 'Idaho', USIL: 'Illinois',
	USIN: 'Indiana', USKY: 'Kentucky', USLA: 'Louisiana', USMA: 'Massachusetts', USMD: 'Maryland',
	USMI: 'Michigan', USMN: 'Minnesota', USMOKS: 'Missouri & Kansas', USMS: 'Mississippi', USMT: 'Montana',
	USNC: 'North Carolina', USND: 'North Dakota', USNE: 'Nebraska', USNH: 'New Hampshire', USNJ: 'New Jersey',
	USNM: 'New Mexico', USNV: 'Nevada', USNY: 'New York', USNYEX: 'New York – Excelsior',
	USNYLI: 'New York – Long Island', USNYNY: 'New York City', USOH: 'Ohio', USOK: 'Oklahoma', USOR: 'Oregon',
	USPA: 'Pennsylvania', USPR: 'Puerto Rico', USRI: 'Rhode Island', USSC: 'South Carolina', USTN: 'Tennessee',
	USTX: 'Texas', USTXCE: 'Texas – Central', USTXHO: 'Texas – Houston', USTXNO: 'Texas – North',
	USTXSO: 'Texas – South', USTXWP: 'Texas – West & Panhandle', USUT: 'Utah', USVA: 'Virginia', USVT: 'Vermont',
	USWA: 'Washington', USWI: 'Wisconsin', USWV: 'West Virginia', USWY: 'Wyoming'
};

/** FTC Scout's country-level options (ISO codes; the US is `UnitedStates`). */
const COUNTRIES = [
	'AE', 'AR', 'AU', 'BR', 'CN', 'CO', 'CY', 'DE', 'EC', 'EG', 'ES', 'FR', 'GB', 'GR', 'HT', 'HU', 'ID', 'IL',
	'IN', 'IT', 'JM', 'JP', 'KR', 'KW', 'KZ', 'LT', 'LY', 'MA', 'MD', 'MX', 'MY', 'NG', 'NL', 'NZ', 'PA', 'PL',
	'PT', 'PY', 'QA', 'RO', 'RU', 'SA', 'SV', 'TH', 'TR', 'TT', 'TW', 'UA', 'VE', 'VN', 'ZA'
] as const satisfies readonly RegionOption[];

const countryNames =
	typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

/** Readable name: "Texas – Houston", "Kazakhstan", "United States"; the code itself when unknown. */
export function regionName(code: string): string {
	if (code === 'All') return 'World';
	if (code === 'UnitedStates') return 'United States';
	if (code === 'International') return 'Outside the US';
	const sub = SUBREGIONS[code as RegionOption];
	if (sub) return sub;
	if (code.length === 2) {
		try {
			return countryNames?.of(code) ?? code;
		} catch {
			return code;
		}
	}
	return code;
}

/**
 * The nation-level option for a region: `UnitedStates` for US regions, the region itself for a
 * two-letter country region, none for e.g. Canadian provinces (FTC Scout has no Canada option).
 */
export function nationOf(region: string | null | undefined): RegionOption | null {
	if (!region) return null;
	if (region.startsWith('US')) return 'UnitedStates';
	return region.length === 2 ? (region as RegionOption) : null;
}

export interface RegionChoice {
	code: RegionOption;
	name: string;
}

const byName = (a: RegionChoice, b: RegionChoice) => a.name.localeCompare(b.name);

/** Nations to pick from (the US + every country option), sorted by name. */
export function nations(): RegionChoice[] {
	return [
		{ code: 'UnitedStates' as RegionOption, name: 'United States' },
		...COUNTRIES.map((c) => ({ code: c, name: regionName(c) }))
	].sort(byName);
}

/** Sub-national FIRST regions (US states/areas, Canadian provinces), sorted by name. */
export function subregions(): RegionChoice[] {
	return (Object.keys(SUBREGIONS) as RegionOption[]).map((code) => ({ code, name: regionName(code) })).sort(byName);
}

/** Most common region among a team's events (its home region). */
export function homeRegion(events: { regionCode?: string | null }[]): RegionOption | null {
	const n = new Map<string, number>();
	for (const e of events) if (e.regionCode) n.set(e.regionCode, (n.get(e.regionCode) ?? 0) + 1);
	return ([...n].sort((a, b) => b[1] - a[1])[0]?.[0] as RegionOption | undefined) ?? null;
}
