import { describe, expect, it } from 'vitest';
import type { MatchRow, MatchAlliance } from '#lib/types.ts';
import { buildPlayoffs, TEMPLATES, type Bracket, type FinalsSeries } from './bracket.ts';

type Row = [series: number, red: [number, number], blue: [number, number], redScore?: number, blueScore?: number];

function side(teams: [number, number], score?: number): MatchAlliance {
	return {
		teams: teams.map((number, i) => ({
			number,
			role: i === 0 ? ('Captain' as const) : ('FirstPick' as const),
			surrogate: false,
			noShow: false,
			dq: false
		})),
		score:
			score === undefined
				? null
				: { total: score, np: score, penaltyByOpp: 0, components: {}, rp: {}, breakdown: [], tiebreakers: [] }
	};
}

function de(rows: Row[], level: MatchRow['level'] = 'DoubleElim'): MatchRow[] {
	return rows.map(([series, red, blue, rs, bs], i) => {
		const played = rs !== undefined && bs !== undefined;
		return {
			id: 20000 + i,
			level,
			series: level === 'Finals' ? 0 : series,
			matchNum: level === 'Finals' ? series : 1,
			label: `M${series}`,
			played,
			scheduledAt: null,
			postedAt: null,
			red: side(red, rs),
			blue: side(blue, bs),
			winner: !played ? null : rs! > bs! ? 'red' : rs! < bs! ? 'blue' : 'tie'
		};
	});
}

const even = () => 0.5;

// Real 2026 results from FTC Scout.
const AUBRQ1: Row[] = [
	[1, [18439, 19450], [14340, 23334], 102, 50],
	[2, [26000, 12993], [11506, 14579], 127, 50],
	[3, [14340, 23334], [11506, 14579], 50, 48],
	[4, [18439, 19450], [26000, 12993], 102, 165],
	[5, [18439, 19450], [14340, 23334], 90, 58],
	[6, [26000, 12993], [18439, 19450], 107, 112],
	[7, [26000, 12993], [18439, 19450], 78, 144]
];
const AUPEQ: Row[] = [
	[1, [37615, 29550], [31555, 37725], 159, 30],
	[2, [36752, 37617], [37618, 37658], 64, 35],
	[3, [31555, 37725], [37618, 37658], 27, 41],
	[4, [37615, 29550], [36752, 37617], 169, 68],
	[5, [36752, 37617], [37618, 37658], 69, 43],
	[6, [37615, 29550], [36752, 37617], 132, 86]
];
const KZASQ1: Row[] = [
	[1, [21094, 29162], [24783, 28862], 91, 89],
	[2, [29029, 21059], [29393, 32728], 136, 100],
	[3, [21062, 28061], [21094, 29162], 208, 187],
	[4, [34350, 37721], [29029, 21059], 173, 118],
	[5, [21094, 29162], [29393, 32728], 131, 85],
	[6, [29029, 21059], [24783, 28862], 72, 106],
	[7, [21062, 28061], [34350, 37721], 226, 216],
	[8, [24783, 28862], [21094, 29162], 54, 162],
	[9, [34350, 37721], [21094, 29162], 186, 171],
	[10, [21062, 28061], [34350, 37721], 159, 199],
	[11, [21062, 28061], [34350, 37721], 107, 221]
];

const bracket = (rows: Row[], teams: number) => buildPlayoffs(de(rows), teams, even, 500) as Bracket;

describe('double-elimination brackets', () => {
	it('detects 4- and 6-alliance brackets and seeds alliances by bracket position', () => {
		expect(bracket(AUBRQ1, 18).template).toBe(TEMPLATES[4]);
		const kz = bracket(KZASQ1, 40);
		expect(kz.template).toBe(TEMPLATES[6]);
		const seeds = Object.fromEntries(kz.alliances.map((a) => [a.seed, a.captain]));
		expect(seeds).toEqual({ 1: 21062, 2: 34350, 3: 29029, 4: 21094, 5: 24783, 6: 29393 });
	});

	it('crowns the winner of the rematch when the lower-bracket alliance forces one', () => {
		expect(bracket(AUBRQ1, 18).champion?.captain).toBe(18439);
		expect(bracket(KZASQ1, 40).champion?.captain).toBe(34350);
	});

	it('skips the rematch when the upper-bracket alliance wins the first final', () => {
		const b = bracket(AUPEQ, 17);
		expect(b.champion?.captain).toBe(37615);
		expect(b.slots.find((s) => s.def.series === 7)?.skipped).toBe(true);
		expect(b.odds[0]).toMatchObject({ p: 1 });
	});

	it('projects unplayed slots from results and the model', () => {
		// Only the first round is in; the favorite (higher captain number here) is projected forward.
		const b = buildPlayoffs(de(AUBRQ1.slice(0, 2)), 18, (r, x) => (r.captain > x.captain ? 0.7 : 0.3), 2000) as Bracket;
		const m3 = b.slots.find((s) => s.def.series === 3)!;
		expect([m3.red.alliance?.captain, m3.blue.alliance?.captain]).toEqual([14340, 11506]);
		expect(m3.red.projected).toBe(false);
		const m4 = b.slots.find((s) => s.def.series === 4)!;
		expect([m4.red.alliance?.captain, m4.blue.alliance?.captain]).toEqual([18439, 26000]);
		expect(m4.pRed).toBe(0.3);
		const total = b.odds.reduce((s, o) => s + o.p, 0);
		expect(total).toBeCloseTo(1, 6);
		expect(b.champion).toBeNull();
	});
});

describe('finals-only events', () => {
	it('scores a best-of-3 and its title odds', () => {
		const f = buildPlayoffs(de([[1, [1, 2], [3, 4], 50, 40]], 'Finals'), 10, () => 0.5) as FinalsSeries;
		expect(f.kind).toBe('finals');
		expect(f.wins).toEqual({ red: 1, blue: 0 });
		// Red needs 1 of the next 2: 1 - 0.5² = 0.75.
		expect(f.odds.find((o) => o.alliance === f.red)!.p).toBeCloseTo(0.75, 6);
	});
});
