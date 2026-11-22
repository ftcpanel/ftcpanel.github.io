// Playoff brackets for FTC double-elimination (2026 format), built from FTC Scout matches.
//
// FTC Scout reports every bracket match as tournamentLevel "DoubleElim" with series = bracket match
// number (M1, M2, …), including the final and its "if needed" rematch. Two shapes exist, verified
// against finished 2026 events (AUBRQ1/AUPEQ = 4 alliances, AUPYQ/BRPIQ/KZASQ1 = 6 alliances):
//   4 alliances: M1 1v4, M2 2v3, M3 L1vL2, M4 W1vW2, M5 L4vW3, M6 W4vW5, M7 rematch if W5 won M6.
//   6 alliances: M1 4v5, M2 3v6, M3 1vW1, M4 2vW2, M5 L3vL2, M6 L4vL1, M7 W3vW4, M8 W6vW5,
//                M9 L7vW8, M10 W7vW9, M11 rematch if W9 won M10.
// Small events play only a best-of-3 "Finals" series (two alliances).
//
// Unplayed slots are projected with the event matchup model; title odds come from Monte Carlo.

import type { MatchRow } from '#lib/types.ts';

export type Source = { seed: number } | { winner: number } | { loser: number };

export interface BracketMatchDef {
	/** Bracket match number (FTC Scout `series`). */
	series: number;
	side: 'upper' | 'lower' | 'final';
	/** Column within its side, left to right. */
	column: number;
	round: string;
	red: Source;
	blue: Source;
	/** Grand-final rematch, only played when the lower-bracket alliance wins the first final. */
	ifNeeded?: true;
}

export interface BracketTemplate {
	alliances: number;
	matches: BracketMatchDef[];
}

const S = (seed: number): Source => ({ seed });
const W = (winner: number): Source => ({ winner });
const L = (loser: number): Source => ({ loser });

export const TEMPLATES: Record<4 | 6, BracketTemplate> = {
	4: {
		alliances: 4,
		matches: [
			{ series: 1, side: 'upper', column: 0, round: 'Upper round 1', red: S(1), blue: S(4) },
			{ series: 2, side: 'upper', column: 0, round: 'Upper round 1', red: S(2), blue: S(3) },
			{ series: 3, side: 'lower', column: 0, round: 'Lower round 1', red: L(1), blue: L(2) },
			{ series: 4, side: 'upper', column: 1, round: 'Upper final', red: W(1), blue: W(2) },
			{ series: 5, side: 'lower', column: 1, round: 'Lower final', red: L(4), blue: W(3) },
			{ series: 6, side: 'final', column: 0, round: 'Final', red: W(4), blue: W(5) },
			{ series: 7, side: 'final', column: 0, round: 'Final (if needed)', red: W(4), blue: W(5), ifNeeded: true }
		]
	},
	6: {
		alliances: 6,
		matches: [
			{ series: 1, side: 'upper', column: 0, round: 'Upper round 1', red: S(4), blue: S(5) },
			{ series: 2, side: 'upper', column: 0, round: 'Upper round 1', red: S(3), blue: S(6) },
			{ series: 3, side: 'upper', column: 1, round: 'Upper round 2', red: S(1), blue: W(1) },
			{ series: 4, side: 'upper', column: 1, round: 'Upper round 2', red: S(2), blue: W(2) },
			{ series: 5, side: 'lower', column: 0, round: 'Lower round 1', red: L(3), blue: L(2) },
			{ series: 6, side: 'lower', column: 0, round: 'Lower round 1', red: L(4), blue: L(1) },
			{ series: 7, side: 'upper', column: 2, round: 'Upper final', red: W(3), blue: W(4) },
			{ series: 8, side: 'lower', column: 1, round: 'Lower round 2', red: W(6), blue: W(5) },
			{ series: 9, side: 'lower', column: 2, round: 'Lower final', red: L(7), blue: W(8) },
			{ series: 10, side: 'final', column: 0, round: 'Final', red: W(7), blue: W(9) },
			{ series: 11, side: 'final', column: 0, round: 'Final (if needed)', red: W(7), blue: W(9), ifNeeded: true }
		]
	}
};

/** Where each seed first appears in the bracket: [series, color]. */
const SEED_SLOTS: Record<4 | 6, Record<number, [number, 'red' | 'blue']>> = {
	4: { 1: [1, 'red'], 4: [1, 'blue'], 2: [2, 'red'], 3: [2, 'blue'] },
	6: { 4: [1, 'red'], 5: [1, 'blue'], 3: [2, 'red'], 6: [2, 'blue'], 1: [3, 'red'], 2: [4, 'red'] }
};

export interface Alliance {
	seed: number;
	captain: number;
	/** All members seen in bracket matches, captain first. */
	teams: number[];
}

export type Color = 'red' | 'blue';

export interface SlotSide {
	alliance: Alliance | null;
	/** True when this alliance isn't confirmed yet (projected from an unplayed match). */
	projected: boolean;
	/** "Winner of M3" etc. for display when unknown. */
	from: string;
	score: number | null;
}

export interface BracketSlot {
	def: BracketMatchDef;
	match: MatchRow | null;
	red: SlotSide;
	blue: SlotSide;
	winner: Color | null;
	/** Probability red wins, when both alliances are known and the match isn't played. */
	pRed: number | null;
	/** Rematch that turned out not to be needed. */
	skipped: boolean;
}

export interface TitleOdds {
	alliance: Alliance;
	p: number;
}

export interface Bracket {
	kind: 'double-elim';
	template: BracketTemplate;
	alliances: Alliance[];
	slots: BracketSlot[];
	odds: TitleOdds[];
	champion: Alliance | null;
}

export interface FinalsSeries {
	kind: 'finals';
	red: Alliance;
	blue: Alliance;
	matches: MatchRow[];
	wins: Record<Color, number>;
	champion: Alliance | null;
	/** Probability each alliance wins the best-of-3 from here. */
	odds: TitleOdds[];
}

/** Probability that `red` beats `blue` in one match. */
export type WinProb = (red: Alliance, blue: Alliance) => number;

const captainOf = (teams: MatchRow['red']['teams']) =>
	(teams.find((t) => t.role === 'Captain') ?? teams[0])?.number;

function detectTemplate(bySeries: Map<number, MatchRow>, teamCount: number): BracketTemplate {
	const m3 = bySeries.get(3);
	const early = [bySeries.get(1), bySeries.get(2)].filter((m): m is MatchRow => !!m);
	if (m3 && m3.red.teams.length && early.length === 2) {
		const earlyCaptains = new Set(early.flatMap((m) => [captainOf(m.red.teams), captainOf(m.blue.teams)]));
		// 6-alliance M3 brings in the #1 seed, who had a bye; 4-alliance M3 is L1 vs L2.
		return earlyCaptains.has(captainOf(m3.red.teams)) ? TEMPLATES[4] : TEMPLATES[6];
	}
	// Bracket not far enough along to tell: larger events run 6 alliances.
	return teamCount > 20 ? TEMPLATES[6] : TEMPLATES[4];
}

/** Builds the bracket (or finals series) from an event's matches; null when there are no playoffs. */
export function buildPlayoffs(
	matches: MatchRow[],
	teamCount: number,
	winProb: WinProb,
	sims = 4000
): Bracket | FinalsSeries | null {
	const de = matches.filter((m) => m.level === 'DoubleElim');
	if (de.length) return buildDoubleElim(de, teamCount, winProb, sims);
	const finals = matches.filter((m) => m.level === 'Finals');
	if (finals.length) return buildFinals(finals, winProb);
	return null;
}

function buildDoubleElim(de: MatchRow[], teamCount: number, winProb: WinProb, sims: number): Bracket {
	const bySeries = new Map(de.map((m) => [m.series, m]));
	const template = detectTemplate(bySeries, teamCount);
	const seeds = SEED_SLOTS[template.alliances as 4 | 6];

	// Alliances by captain; seeds from their first bracket slot.
	const alliances = new Map<number, Alliance>();
	const allianceOf = (teams: MatchRow['red']['teams']): Alliance | null => {
		const captain = captainOf(teams);
		if (captain === undefined) return null;
		let a = alliances.get(captain);
		if (!a) {
			a = { seed: 0, captain, teams: [captain] };
			alliances.set(captain, a);
		}
		for (const t of teams) if (!a.teams.includes(t.number)) a.teams.push(t.number);
		return a;
	};
	for (const m of de) {
		allianceOf(m.red.teams);
		allianceOf(m.blue.teams);
	}
	const bySeed = new Map<number, Alliance>();
	for (const [seed, [series, color]] of Object.entries(seeds)) {
		const m = bySeries.get(series);
		const a = m ? allianceOf(m[color].teams) : null;
		if (a) {
			a.seed = Number(seed);
			bySeed.set(Number(seed), a);
		}
	}

	// Resolve slots in bracket order: actual teams where scheduled, else projected from sources.
	const slots: BracketSlot[] = [];
	const resolved = new Map<number, BracketSlot>();
	const fromLabel = (s: Source) => ('seed' in s ? `Alliance ${s.seed}` : 'winner' in s ? `Winner of M${s.winner}` : `Loser of M${s.loser}`);
	const sideFrom = (s: Source): SlotSide => {
		if ('seed' in s) return { alliance: bySeed.get(s.seed) ?? null, projected: false, from: fromLabel(s), score: null };
		const prev = resolved.get('winner' in s ? s.winner : s.loser);
		if (!prev || !prev.red.alliance || !prev.blue.alliance) return { alliance: null, projected: true, from: fromLabel(s), score: null };
		const projected = prev.winner === null;
		const winnerColor: Color = prev.winner ?? ((prev.pRed ?? 0.5) >= 0.5 ? 'red' : 'blue');
		const color: Color = 'winner' in s ? winnerColor : winnerColor === 'red' ? 'blue' : 'red';
		return { alliance: prev[color].alliance, projected: projected || prev[color].projected, from: fromLabel(s), score: null };
	};

	for (const def of template.matches) {
		const match = bySeries.get(def.series) ?? null;
		const red = match?.red.teams.length ? { alliance: allianceOf(match.red.teams), projected: false, from: fromLabel(def.red), score: null } : sideFrom(def.red);
		const blue = match?.blue.teams.length ? { alliance: allianceOf(match.blue.teams), projected: false, from: fromLabel(def.blue), score: null } : sideFrom(def.blue);
		let winner: Color | null = null;
		if (match?.played && match.red.score && match.blue.score) {
			red.score = match.red.score.total;
			blue.score = match.blue.score.total;
			winner = match.winner === 'tie' ? null : match.winner;
		}
		// The rematch only happens if the lower-bracket alliance (blue) won the first final.
		const first = def.ifNeeded ? resolved.get(def.series - 1) : undefined;
		const skipped = !!def.ifNeeded && !match && first?.winner === 'red';
		const pRed = !winner && !skipped && red.alliance && blue.alliance ? winProb(red.alliance, blue.alliance) : null;
		const slot: BracketSlot = { def, match, red, blue, winner, pRed, skipped };
		slots.push(slot);
		resolved.set(def.series, slot);
	}

	// The decider is the rematch when it's needed, else the first final.
	const decider = slots.filter((s) => s.def.side === 'final' && !s.skipped).at(-1);
	const champion = decider?.winner ? decider[decider.winner].alliance : null;

	return {
		kind: 'double-elim',
		template,
		alliances: [...alliances.values()].sort((a, b) => (a.seed || 99) - (b.seed || 99)),
		slots,
		odds: simulateTitle(template, slots, bySeed, winProb, sims),
		champion
	};
}

/** Monte Carlo over the unplayed bracket; played matches keep their real result. */
function simulateTitle(
	template: BracketTemplate,
	slots: BracketSlot[],
	bySeed: Map<number, Alliance>,
	winProb: WinProb,
	sims: number
): TitleOdds[] {
	if (bySeed.size < template.alliances) return [];
	const cache = new Map<string, number>();
	const p = (r: Alliance, b: Alliance) => {
		const key = `${r.captain}:${b.captain}`;
		let v = cache.get(key);
		if (v === undefined) cache.set(key, (v = winProb(r, b)));
		return v;
	};
	const wins = new Map<Alliance, number>();
	const played = new Map(slots.filter((s) => s.winner).map((s) => [s.def.series, s]));
	for (let n = 0; n < sims; n++) {
		const out = new Map<number, { w: Alliance; l: Alliance; red: Alliance; winnerRed: boolean }>();
		const pick = (s: Source): Alliance => {
			if ('seed' in s) return bySeed.get(s.seed)!;
			const o = out.get('winner' in s ? s.winner : s.loser)!;
			return 'winner' in s ? o.w : o.l;
		};
		let champ: Alliance | null = null;
		for (const def of template.matches) {
			if (def.ifNeeded && out.get(def.series - 1)?.winnerRed) break;
			const red = pick(def.red);
			const blue = pick(def.blue);
			const real = played.get(def.series);
			const redWins = real ? real.winner === 'red' : Math.random() < p(red, blue);
			out.set(def.series, { w: redWins ? red : blue, l: redWins ? blue : red, red, winnerRed: redWins });
			if (def.side === 'final') champ = redWins ? red : blue;
		}
		if (champ) wins.set(champ, (wins.get(champ) ?? 0) + 1);
	}
	return [...bySeed.values()]
		.map((alliance) => ({ alliance, p: (wins.get(alliance) ?? 0) / sims }))
		.sort((a, b) => b.p - a.p);
}

function buildFinals(finals: MatchRow[], winProb: WinProb): FinalsSeries | null {
	const first = finals.find((m) => m.red.teams.length && m.blue.teams.length);
	if (!first) return null;
	const mk = (teams: MatchRow['red']['teams'], seed: number): Alliance => ({
		seed,
		captain: captainOf(teams)!,
		teams: teams.map((t) => t.number)
	});
	const red = mk(first.red.teams, 1);
	const blue = mk(first.blue.teams, 2);
	const wins: Record<Color, number> = { red: 0, blue: 0 };
	for (const m of finals) if (m.played && (m.winner === 'red' || m.winner === 'blue')) wins[m.winner]++;
	const champion = wins.red >= 2 ? red : wins.blue >= 2 ? blue : null;
	// Best of 3 from the current series score (ties replay, so they're ignored).
	const pRed = champion ? (champion === red ? 1 : 0) : seriesWin(2 - wins.red, 2 - wins.blue, winProb(red, blue));
	return {
		kind: 'finals',
		red,
		blue,
		matches: finals,
		wins,
		champion,
		odds: [
			{ alliance: red, p: pRed },
			{ alliance: blue, p: 1 - pRed }
		].sort((a, b) => b.p - a.p)
	};
}

/** P(red gets `r` more wins before blue gets `b` more), each game red wins with p. */
function seriesWin(r: number, b: number, p: number): number {
	if (r <= 0) return 1;
	if (b <= 0) return 0;
	return p * seriesWin(r - 1, b, p) + (1 - p) * seriesWin(r, b - 1, p);
}
