// A team's qualification rank after each of its matches at an event, recomputed from the match
// results (same rules as the live rankings). The last point is pinned to the event's current
// ranking, which also folds in RP that can't be derived from scores.

import type { SeasonInfo } from '#lib/seasons/index.ts';
import type { MatchRow, RankingRow } from '#lib/types.ts';
import { liveStandings, teamRecords } from './rankings.ts';

export interface RankPoint {
	/** Match label, e.g. "Q12". */
	label: string;
	rank: number;
	/** Teams ranked at that point. */
	of: number;
}

export function rankHistory(
	team: number,
	matches: MatchRow[],
	rankings: RankingRow[],
	season: SeasonInfo
): RankPoint[] {
	const quals = matches.filter((m) => m.level === 'Quals' && m.played);
	const points: RankPoint[] = [];
	for (let i = 0; i < quals.length; i++) {
		const m = quals[i];
		if (![...m.red.teams, ...m.blue.teams].some((t) => t.number === team && !t.surrogate)) continue;
		const standings = liveStandings(teamRecords(quals.slice(0, i + 1), season), new Map(), season);
		const s = standings.get(team);
		if (s) points.push({ label: m.label, rank: s.rank, of: standings.size });
	}
	const current = rankings.find((r) => r.team === team)?.stats;
	if (points.length && current) {
		points[points.length - 1] = { ...points[points.length - 1], rank: current.rank, of: rankings.filter((r) => r.stats).length };
	}
	return points;
}
