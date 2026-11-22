import { describe, expect, it } from 'vitest';
import type { MatchRow } from '#lib/types.ts';
import { fitEventModel, phi, predictMatchup } from './matchup.ts';

const comps = ['auto', 'teleop'];
const truth: Record<number, { auto: number; teleop: number }> = {
	1: { auto: 10, teleop: 40 },
	2: { auto: 5, teleop: 20 },
	3: { auto: 20, teleop: 10 },
	4: { auto: 0, teleop: 30 }
};

function match(id: number, red: number[], blue: number[]): MatchRow {
	const side = (teams: number[]) => {
		const auto = teams.reduce((s, t) => s + truth[t].auto, 0);
		const teleop = teams.reduce((s, t) => s + truth[t].teleop, 0);
		return {
			teams: teams.map((number) => ({ number, role: 'Solo' as const, surrogate: false, noShow: false, dq: false })),
			score: {
				total: auto + teleop,
				np: auto + teleop,
				penaltyByOpp: 0,
				components: { auto, teleop },
				rp: {},
				breakdown: [],
				tiebreakers: []
			}
		};
	};
	return {
		id,
		level: 'Quals',
		series: 0,
		matchNum: id,
		label: `Q${id}`,
		played: true,
		scheduledAt: null,
		postedAt: null,
		red: side(red),
		blue: side(blue),
		winner: null
	};
}

// Every pairing of the four teams, many times over.
const pairings: [number[], number[]][] = [
	[[1, 2], [3, 4]],
	[[1, 3], [2, 4]],
	[[1, 4], [2, 3]]
];
const matches = Array.from({ length: 60 }, (_, i) => match(i + 1, ...pairings[i % 3]));
// Tiny λ: the ridge prior's intended shrinkage bias vanishes, so noise-free data is recovered exactly.
const TINY_LAMBDA = 0.001;

describe('fitEventModel', () => {
	it('recovers per-component team strengths from noise-free matches', () => {
		const model = fitEventModel(matches, [1, 2, 3, 4], new Map(), comps, TINY_LAMBDA);
		for (const [team, t] of Object.entries(truth)) {
			const s = model.strengths.get(Number(team))!;
			expect(s.components.auto).toBeCloseTo(t.auto, 1);
			expect(s.components.teleop).toBeCloseTo(t.teleop, 1);
			expect(s.source).toBe('event');
		}
	});

	it('falls back to priors before any match is played', () => {
		const priors = new Map([[1, { auto: 12, teleop: 34 }]]);
		const model = fitEventModel([], [1, 2], priors, comps);
		const s = model.strengths.get(1)!;
		expect(s.components.auto).toBeCloseTo(12, 6);
		expect(s.components.teleop).toBeCloseTo(34, 6);
		expect(s.source).toBe('prior');
		expect(model.strengths.get(2)!.source).toBe('field');
	});

	it('ignores no-show teams when attributing an alliance score', () => {
		const m = match(1, [1, 2], [3, 4]);
		m.red.teams[1].noShow = true;
		const model = fitEventModel([m], [1, 2, 3, 4], new Map(), comps);
		expect(model.strengths.get(2)!.matches).toBe(0);
		expect(model.strengths.get(1)!.matches).toBe(1);
	});
});

describe('predictMatchup', () => {
	const model = fitEventModel(matches, [1, 2, 3, 4], new Map(), comps, TINY_LAMBDA);

	it('favors the stronger alliance and is symmetric under swapping sides', () => {
		const a = predictMatchup(model, [1, 3], [2, 4]); // 80 vs 55
		const b = predictMatchup(model, [2, 4], [1, 3]);
		expect(a.margin).toBeCloseTo(25, 1);
		expect(a.pRed).toBeGreaterThan(0.5);
		expect(a.pRed + b.pRed).toBeCloseTo(1, 6);
	});

	it('gives even odds for identical alliances', () => {
		expect(predictMatchup(model, [1, 2], [1, 2]).pRed).toBeCloseTo(0.5, 6);
	});
});

describe('phi', () => {
	it('matches known standard normal values', () => {
		expect(phi(0)).toBeCloseTo(0.5, 6);
		expect(phi(1.96)).toBeCloseTo(0.975, 3);
		expect(phi(-1)).toBeCloseTo(0.1587, 3);
	});
});
