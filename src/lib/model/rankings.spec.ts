import { describe, expect, it } from 'vitest';
import { seasonInfo } from '#lib/seasons/index.ts';
import type { MatchAlliance, MatchRow } from '#lib/types.ts';
import { liveStandings, teamRecords, type Standing } from './rankings.ts';

const season = seasonInfo(2026);

function side(
	teams: number[],
	total: number,
	opts: { swarm?: boolean; tips?: number; surrogate?: number; dq?: number } = {}
): MatchAlliance {
	return {
		teams: teams.map((number) => ({
			number,
			role: 'Solo' as const,
			surrogate: number === opts.surrogate,
			noShow: false,
			dq: number === opts.dq
		})),
		score: {
			total,
			np: total,
			penaltyByOpp: 0,
			components: {},
			rp: { swarmRp: opts.swarm ?? false, pollinator1Rp: false, pollinator2Rp: false },
			breakdown: [],
			tiebreakers: [total, opts.tips ?? 0]
		}
	};
}

function qual(id: number, red: MatchAlliance, blue: MatchAlliance): MatchRow {
	return {
		id,
		level: 'Quals',
		series: 0,
		matchNum: id,
		label: `Q${id}`,
		played: true,
		scheduledAt: null,
		postedAt: null,
		red,
		blue,
		winner: null
	};
}

const local = (matches: MatchRow[]) => liveStandings(teamRecords(matches, season), new Map(), season);

describe('liveStandings from matches only', () => {
	it('scores win/tie RP plus bonus RPs and averages over matches', () => {
		const r = local([
			qual(1, side([1, 2], 50, { swarm: true }), side([3, 4], 40)), // 1,2: 3 + 1
			qual(2, side([1, 3], 30), side([2, 4], 30)) // tie: 1 each
		]);
		expect(r.get(1)!.rs).toBe((4 + 1) / 2);
		expect(r.get(4)!.rs).toBe((0 + 1) / 2);
		expect(r.get(1)).toMatchObject({ wins: 1, losses: 0, ties: 1, played: 2 });
		expect(r.get(1)!.rpRate.swarmRp).toBe(0.5);
	});

	it('skips surrogate appearances and gives a DQ team no RP', () => {
		const r = local([
			qual(1, side([1, 2], 50, { surrogate: 2 }), side([3, 4], 40)),
			qual(2, side([1, 3], 60, { dq: 3 }), side([2, 4], 10))
		]);
		expect(r.get(2)!.played).toBe(1);
		expect(r.get(3)!.rs).toBe(0);
		expect(r.get(1)!.rs).toBe(3);
	});

	it('breaks RS ties by average score, then average tips', () => {
		const r = local([
			qual(1, side([1, 2], 80, { tips: 1 }), side([5, 6], 10)),
			qual(2, side([3, 4], 80, { tips: 4 }), side([7, 8], 10)),
			qual(3, side([9, 10], 90), side([11, 12], 10))
		]);
		expect(r.get(9)!.rank).toBe(1);
		expect(r.get(3)!.rank).toBe(3);
		expect(r.get(1)!.rank).toBe(5);
	});
});

describe('liveStandings on top of official stats', () => {
	const official = (rank: number, rs: number, played: number): Standing => ({
		rank,
		rs,
		tb: [50, 1],
		wins: played,
		losses: 0,
		ties: 0,
		played,
		avgNp: 50,
		maxNp: 60,
		rpRate: { swarmRp: 0, pollinator1Rp: 0, pollinator2Rp: 0 }
	});
	const m1 = qual(1, side([1, 2], 50), side([3, 4], 40));
	const m2 = qual(2, side([3, 4], 90, { swarm: true }), side([1, 2], 10));

	it('keeps official values (including RP not derivable from scores) when nothing is new', () => {
		const off = new Map([
			[1, official(1, 4, 1)], // official RS 4 although match 1 alone gives 3
			[2, official(2, 3, 1)]
		]);
		const r = liveStandings(teamRecords([m1], season), off, season);
		expect(r.get(1)).toMatchObject({ rank: 1, rs: 4 });
	});

	it('extends official stats with a pushed result and re-ranks immediately', () => {
		const off = new Map([
			[1, official(1, 3, 1)],
			[2, official(2, 3, 1)],
			[3, official(3, 0, 1)],
			[4, official(4, 0, 1)]
		]);
		const r = liveStandings(teamRecords([m1, m2], season), off, season);
		expect(r.get(3)).toMatchObject({ played: 2, rs: (0 + 4) / 2, wins: 2 });
		expect(r.get(1)).toMatchObject({ played: 2, rs: 3 / 2, losses: 1 });
		expect(r.get(3)!.rank).toBeLessThan(r.get(1)!.rank);
	});
});
