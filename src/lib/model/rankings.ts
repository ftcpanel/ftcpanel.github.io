// Live qualification standings.
//
// FTC Scout's GraphQL responses are cached server-side per query text (~2 min observed), while
// `newMatches` pushes arrive immediately. So standings = FTC Scout's official stats, extended
// in the browser with any match results those stats don't include yet. The table moves the moment
// a result is pushed and converges to FTC Scout's numbers on the next refetch.
//
// Why not compute everything locally: on 30 finished 2026 events, local RS matched FTC Scout for
// 588/596 teams. The rest have RP that isn't derivable from match scores (likely referee-awarded
// RP), so official stats stay the base. Rules (SeasonInfo.winRp / tiebreakers) are in the season
// adapter.

import type { SeasonInfo } from '#lib/seasons/index.ts';
import type { MatchRow, TeamEventStats } from '#lib/types.ts';

export interface TeamMatchRecord {
	rp: number;
	result: 'W' | 'L' | 'T';
	np: number;
	/** Per-match tiebreaker values, in SeasonInfo.tiebreakers order. */
	tb: number[];
	rpHits: Record<string, boolean>;
}

/** Each team's counted qualification results (surrogate appearances excluded), in play order. */
export function teamRecords(matches: MatchRow[], season: SeasonInfo): Map<number, TeamMatchRecord[]> {
	const records = new Map<number, TeamMatchRecord[]>();
	for (const m of matches) {
		if (m.level !== 'Quals' || !m.played) continue;
		for (const [own, opp] of [
			[m.red, m.blue],
			[m.blue, m.red]
		]) {
			const s = own.score;
			const o = opp.score;
			if (!s || !o) continue;
			const result = s.total > o.total ? 'W' : s.total < o.total ? 'L' : 'T';
			const earned =
				(result === 'W' ? season.winRp.win : result === 'T' ? season.winRp.tie : 0) +
				season.rps.reduce((n, rp) => n + (s.rp[rp.key] ? 1 : 0), 0);
			for (const t of own.teams) {
				if (t.surrogate) continue;
				const list = records.get(t.number) ?? [];
				list.push({ rp: t.dq ? 0 : earned, result, np: s.np, tb: s.tiebreakers, rpHits: s.rp });
				records.set(t.number, list);
			}
		}
	}
	return records;
}

export type Standing = Pick<
	TeamEventStats,
	'rank' | 'rs' | 'wins' | 'losses' | 'ties' | 'played' | 'avgNp' | 'maxNp' | 'rpRate'
> & {
	/** Tiebreaker means, in SeasonInfo.tiebreakers order. */
	tb: number[];
};

/**
 * Official standings extended with the records they don't count yet. A team's first
 * `official.played` records are assumed to be the ones already in its official stats.
 */
export function liveStandings(
	records: Map<number, TeamMatchRecord[]>,
	official: Map<number, Standing>,
	season: SeasonInfo
): Map<number, Standing> {
	const rows: (Standing & { team: number })[] = [];
	let extended = false;
	for (const team of new Set([...official.keys(), ...records.keys()])) {
		const base = official.get(team);
		const n = base?.played ?? 0;
		const extra = (records.get(team) ?? []).slice(n);
		if (extra.length === 0) {
			if (base) rows.push({ ...base, team });
			continue;
		}
		extended = true;
		const played = n + extra.length;
		const mean = (baseMean: number, add: number) => (baseMean * n + add) / played;
		rows.push({
			team,
			rank: base?.rank ?? Infinity,
			rs: mean(base?.rs ?? 0, extra.reduce((s, r) => s + r.rp, 0)),
			tb: season.tiebreakers.map((_, i) => mean(base?.tb[i] ?? 0, extra.reduce((s, r) => s + r.tb[i], 0))),
			wins: (base?.wins ?? 0) + extra.filter((r) => r.result === 'W').length,
			losses: (base?.losses ?? 0) + extra.filter((r) => r.result === 'L').length,
			ties: (base?.ties ?? 0) + extra.filter((r) => r.result === 'T').length,
			played,
			avgNp: mean(base?.avgNp ?? 0, extra.reduce((s, r) => s + r.np, 0)),
			maxNp: Math.max(base?.maxNp ?? 0, ...extra.map((r) => r.np)),
			rpRate: Object.fromEntries(
				season.rps.map((rp) => [
					rp.key,
					mean(base?.rpRate[rp.key] ?? 0, extra.filter((r) => r.rpHits[rp.key]).length)
				])
			)
		});
	}

	if (extended) {
		// Re-rank by the season's ordering; the official rank breaks any remaining ties.
		rows.sort((a, b) => {
			if (b.rs !== a.rs) return b.rs - a.rs;
			for (let i = 0; i < a.tb.length; i++) if (b.tb[i] !== a.tb[i]) return b.tb[i] - a.tb[i];
			return a.rank - b.rank || a.team - b.team;
		});
		rows.forEach((r, i) => (r.rank = i + 1));
	}
	return new Map(rows.map(({ team, ...s }) => [team, s]));
}
