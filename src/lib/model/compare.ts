// Team comparison: per-team season summaries and head-to-head meetings between compared teams.

import type { MyTeamQuery } from '#lib/api/gql/graphql.ts';
import { place } from '#lib/format.ts';
import { compareMatches, normalizeStats } from '#lib/seasons/index.ts';
import type { AllianceColor, MatchRow, TeamEventStats } from '#lib/types.ts';

export const MAX_COMPARE = 4;

/** Series colors by slot after the first (which uses the violet accent); red/blue stay alliance-only. */
const OTHER_COLORS = ['#14b8a6', '#f59e0b', '#ec4899'];

/** A compared team's series color. `accent` is the resolved accent (charts) or `var(--accent)` (CSS). */
export function slotColor(slot: number, accent = 'var(--accent)'): string {
	return slot === 0 ? accent : OTHER_COLORS[(slot - 1) % OTHER_COLORS.length];
}

/** Team numbers from `?teams=1,2,3`: valid, de-duplicated, at most MAX_COMPARE. */
export function parseTeams(param: string | null): number[] {
	const out: number[] = [];
	for (const part of (param ?? '').split(',')) {
		const s = part.trim();
		if (!/^\d{1,6}$/.test(s) || Number(s) <= 0) continue;
		const n = Number(s);
		if (!out.includes(n)) out.push(n);
	}
	return out.slice(0, MAX_COMPARE);
}

export interface CompareEvent {
	code: string;
	name: string;
	start: string;
	stats: TeamEventStats;
}

export interface SeasonStat {
	value: number;
	rank: number;
}

export interface CompareTeam {
	number: number;
	name: string;
	place: string;
	/** Position in the comparison (drives the series color). */
	slot: number;
	/** Season OPR (FTC Scout quick stats); null before the team has played. */
	season: { count: number; tot: SeasonStat; auto: SeasonStat; dc: SeasonStat; eg: SeasonStat } | null;
	/** Events with results, oldest first. */
	events: CompareEvent[];
	bestEvent: CompareEvent | null;
	latest: CompareEvent | null;
	record: { wins: number; losses: number; ties: number };
	bestScore: number | null;
}

type TeamData = NonNullable<MyTeamQuery['teamByNumber']>;

export function compareTeam(t: TeamData, slot: number): CompareTeam {
	const events: CompareEvent[] = [];
	for (const e of t.events) {
		const stats = normalizeStats(e.stats);
		if (stats && stats.played > 0) events.push({ code: e.event.code, name: e.event.name, start: e.event.start, stats });
	}
	events.sort((a, b) => a.start.localeCompare(b.start));
	const record = { wins: 0, losses: 0, ties: 0 };
	let bestEvent: CompareEvent | null = null;
	let bestScore: number | null = null;
	for (const e of events) {
		record.wins += e.stats.wins;
		record.losses += e.stats.losses;
		record.ties += e.stats.ties;
		if (!bestEvent || e.stats.oprNp > bestEvent.stats.oprNp) bestEvent = e;
		if (bestScore === null || e.stats.maxNp > bestScore) bestScore = e.stats.maxNp;
	}
	return {
		number: t.number,
		name: t.name,
		place: place(t.location),
		slot,
		season: t.quickStats,
		events,
		bestEvent,
		latest: events.at(-1) ?? null,
		record,
		bestScore
	};
}

export interface MeetingMatch {
	eventCode: string;
	match: MatchRow;
	/** Alliance of the pair's first / second team. */
	aSide: AllianceColor;
	bSide: AllianceColor;
}

export interface Meetings {
	a: number;
	b: number;
	matches: MeetingMatch[];
	/** Played matches on the same alliance. */
	together: { wins: number; losses: number; ties: number };
	/** Played matches on opposite alliances. */
	against: { aWins: number; bWins: number; ties: number };
}

const sideOf = (m: MatchRow, team: number): AllianceColor | null =>
	m.red.teams.some((t) => t.number === team) ? 'red' : m.blue.teams.some((t) => t.number === team) ? 'blue' : null;

/**
 * Every pair of `teams` that shared a match (as partners or opponents), in event order then play order.
 * `matches` may contain duplicates (each team's schedule lists the same match); `eventStart` orders events.
 */
export function meetings(
	teams: number[],
	matches: { eventCode: string; match: MatchRow }[],
	eventStart: Map<string, string>
): Meetings[] {
	const unique = new Map<string, { eventCode: string; match: MatchRow }>();
	for (const m of matches) unique.set(`${m.eventCode}:${m.match.id}`, m);
	const ordered = [...unique.values()].sort(
		(x, y) =>
			(eventStart.get(x.eventCode) ?? '').localeCompare(eventStart.get(y.eventCode) ?? '') ||
			x.eventCode.localeCompare(y.eventCode) ||
			compareMatches(x.match, y.match)
	);

	const out: Meetings[] = [];
	for (let i = 0; i < teams.length; i++) {
		for (let j = i + 1; j < teams.length; j++) {
			const pair: Meetings = {
				a: teams[i],
				b: teams[j],
				matches: [],
				together: { wins: 0, losses: 0, ties: 0 },
				against: { aWins: 0, bWins: 0, ties: 0 }
			};
			for (const { eventCode, match } of ordered) {
				const aSide = sideOf(match, pair.a);
				const bSide = sideOf(match, pair.b);
				if (!aSide || !bSide) continue;
				pair.matches.push({ eventCode, match, aSide, bSide });
				const w = match.winner;
				if (!w) continue;
				if (aSide === bSide) {
					if (w === 'tie') pair.together.ties++;
					else if (w === aSide) pair.together.wins++;
					else pair.together.losses++;
				} else if (w === 'tie') pair.against.ties++;
				else if (w === aSide) pair.against.aWins++;
				else pair.against.bWins++;
			}
			if (pair.matches.length > 0) out.push(pair);
		}
	}
	return out;
}
