export function place(loc: { city: string; state: string; country: string }): string {
	const region = loc.country === 'USA' || loc.country === 'Canada' ? loc.state : loc.country;
	return [loc.city, region].filter(Boolean).join(', ');
}

export function num(value: number | null | undefined, digits = 1): string {
	return value == null || Number.isNaN(value) ? '–' : value.toFixed(digits);
}

export function pct(value: number): string {
	return `${Math.round(value * 100)}%`;
}

export function record(s: { wins: number; losses: number; ties: number }): string {
	return `${s.wins}-${s.losses}-${s.ties}`;
}

/** "LeagueMeet" → "League Meet". */
export function eventType(type: string): string {
	return type.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/** "Nov 22" or "Nov 21 – 22" from ISO dates (YYYY-MM-DD), without timezone shifts. */
export function dateRange(start: string, end: string): string {
	const fmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
	const a = fmt.format(new Date(`${start}T00:00:00Z`));
	if (start === end) return a;
	return `${a} – ${fmt.format(new Date(`${end}T00:00:00Z`))}`;
}

export function clock(iso: string): string {
	return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** ISO date (YYYY-MM-DD) in local time, offset by `days`. */
export function isoDay(days = 0, from = new Date()): string {
	const d = new Date(from);
	d.setDate(d.getDate() + days);
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
