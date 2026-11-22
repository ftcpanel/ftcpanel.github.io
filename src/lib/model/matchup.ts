// Event matchup model (v1).
//
// Team strength per scoring component = ridge-regularized OPR fitted on the event's played
// matches, shrunk toward a prior (the team's stats from an earlier event, else the field mean):
//
//   minimize ||A x − b||² + λ ||x − prior||²   ⇒   (AᵀA + λI) x = Aᵀb + λ·prior
//
// With no matches played x = prior; as matches accumulate the event data dominates.
// Alliance prediction = sum of its teams' strengths. Win probability assumes normally
// distributed alliance scores: P(red) = Φ((μ_red − μ_blue) / (σ·√2)), with σ the per-alliance
// residual SD of the fit. Everything is in no-penalty points.
//
// This is recomputed in the browser on every pushed match, so predictions are as fresh as the
// match data. The season-wide EPA model (docs/ARCHITECTURE.md §7) will replace the prior later.

import type { ComponentValues, MatchRow } from '#lib/types.ts';

/**
 * Ridge strength: how many matches' worth of weight the prior gets. Backtest (2026-11-22, 30 finished
 * 2026 qualifiers, 645 out-of-sample quals, field-mean priors): λ=1.5 → 75.0% accuracy,
 * Brier 0.169, calibrated within ±0.04 per 10-point bucket. λ=0.5/4/8 were worse.
 */
export const LAMBDA = 1.5;
/** σ used before enough matches exist to measure it, as a fraction of the mean alliance score. */
const DEFAULT_SIGMA_FRACTION = 0.3;
/** Residual SD is only trusted after this many alliance results. */
const MIN_ROWS_FOR_SIGMA = 12;

export type StrengthSource = 'event' | 'prior' | 'field';

export interface TeamStrength {
	team: number;
	components: ComponentValues;
	total: number;
	/** Matches played at this event that informed the estimate. */
	matches: number;
	/** Where the estimate mostly comes from. */
	source: StrengthSource;
}

export interface EventModel {
	components: string[];
	strengths: Map<number, TeamStrength>;
	/** Per-alliance score SD (no penalties). */
	sigma: number;
	/** Mean alliance score (no penalties) the model is centered on. */
	meanScore: number;
	/** Played alliance results used in the fit. */
	rows: number;
	/** False when there are no played matches and no priors: predictions would be pure guesses. */
	hasData: boolean;
}

export interface AlliancePrediction {
	teams: TeamStrength[];
	components: ComponentValues;
	total: number;
}

export interface MatchupPrediction {
	red: AlliancePrediction;
	blue: AlliancePrediction;
	/** Probability red wins, 0–1. */
	pRed: number;
	/** Expected red − blue margin. */
	margin: number;
	/** SD of the margin. */
	marginSd: number;
	confidence: 'low' | 'medium' | 'high';
}

/** Standard normal CDF (Abramowitz–Stegun 7.1.26 erf, |error| < 1.5e-7). */
export function phi(z: number): number {
	const x = Math.abs(z) / Math.SQRT2;
	const t = 1 / (1 + 0.3275911 * x);
	const erf =
		1 -
		((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
			t *
			Math.exp(-x * x);
	return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/** Solves M x = rhs for symmetric positive-definite M (Cholesky). Columns of rhs solved together. */
function solveSpd(M: Float64Array, n: number, rhs: Float64Array[]): Float64Array[] {
	const L = new Float64Array(n * n);
	for (let i = 0; i < n; i++) {
		for (let j = 0; j <= i; j++) {
			let s = M[i * n + j];
			for (let k = 0; k < j; k++) s -= L[i * n + k] * L[j * n + k];
			L[i * n + j] = i === j ? Math.sqrt(s) : s / L[j * n + j];
		}
	}
	return rhs.map((b) => {
		const y = new Float64Array(n);
		for (let i = 0; i < n; i++) {
			let s = b[i];
			for (let k = 0; k < i; k++) s -= L[i * n + k] * y[k];
			y[i] = s / L[i * n + i];
		}
		const x = new Float64Array(n);
		for (let i = n - 1; i >= 0; i--) {
			let s = y[i];
			for (let k = i + 1; k < n; k++) s -= L[k * n + i] * x[k];
			x[i] = s / L[i * n + i];
		}
		return x;
	});
}

interface Row {
	teams: number[];
	values: ComponentValues;
	np: number;
}

function playedRows(matches: MatchRow[]): Row[] {
	const rows: Row[] = [];
	for (const m of matches) {
		if (!m.played) continue;
		for (const side of [m.red, m.blue]) {
			const teams = side.teams.filter((t) => !t.noShow).map((t) => t.number);
			if (side.score && teams.length > 0) {
				rows.push({ teams, values: side.score.components, np: side.score.np });
			}
		}
	}
	return rows;
}

export function fitEventModel(
	matches: MatchRow[],
	teams: number[],
	priors: Map<number, ComponentValues>,
	components: string[],
	lambda = LAMBDA
): EventModel {
	const rows = playedRows(matches);
	const ids = [...new Set([...teams, ...rows.flatMap((r) => r.teams)])];
	const index = new Map(ids.map((t, i) => [t, i]));
	const n = ids.length;

	// Field mean per team: half the mean alliance score when matches exist, else mean of priors.
	const field: ComponentValues = {};
	const known = [...priors.values()];
	for (const c of components) {
		field[c] = rows.length
			? rows.reduce((s, r) => s + r.values[c], 0) / rows.length / 2
			: known.length
				? known.reduce((s, p) => s + p[c], 0) / known.length
				: 0;
	}

	const M = new Float64Array(n * n);
	const rhs = components.map(() => new Float64Array(n));
	const played = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		M[i * n + i] = lambda;
		const prior = priors.get(ids[i]) ?? field;
		components.forEach((c, ci) => (rhs[ci][i] = lambda * prior[c]));
	}
	for (const r of rows) {
		const idx = r.teams.map((t) => index.get(t)!);
		for (const i of idx) {
			played[i]++;
			for (const j of idx) M[i * n + j] += 1;
			components.forEach((c, ci) => (rhs[ci][i] += r.values[c]));
		}
	}
	const solved = n ? solveSpd(M, n, rhs) : [];

	const strengths = new Map<number, TeamStrength>();
	ids.forEach((team, i) => {
		const values: ComponentValues = {};
		components.forEach((c, ci) => (values[c] = solved[ci][i]));
		strengths.set(team, {
			team,
			components: values,
			total: components.reduce((s, c) => s + values[c], 0),
			matches: played[i],
			source: played[i] >= lambda ? 'event' : priors.has(team) ? 'prior' : 'field'
		});
	});

	const meanScore = components.reduce((s, c) => s + field[c], 0) * 2;
	let sigma = DEFAULT_SIGMA_FRACTION * meanScore + 5;
	if (rows.length >= MIN_ROWS_FOR_SIGMA) {
		let sq = 0;
		for (const r of rows) {
			const pred = r.teams.reduce((s, t) => s + strengths.get(t)!.total, 0);
			sq += (r.np - pred) ** 2;
		}
		// In-sample residuals understate error; inflate by the share of fitted parameters.
		const dof = Math.max(1, rows.length - n / 2);
		sigma = Math.max(5, Math.sqrt(sq / dof));
	}

	return {
		components,
		strengths,
		sigma,
		meanScore,
		rows: rows.length,
		hasData: rows.length > 0 || priors.size > 0
	};
}

function strengthOf(model: EventModel, team: number): TeamStrength {
	const known = model.strengths.get(team);
	if (known) return known;
	const share = model.meanScore / 2 / Math.max(1, model.components.length);
	const components = Object.fromEntries(model.components.map((c) => [c, share]));
	return { team, components, total: model.meanScore / 2, matches: 0, source: 'field' };
}

function alliance(model: EventModel, teams: number[]): AlliancePrediction {
	const ts = teams.map((t) => strengthOf(model, t));
	const components: ComponentValues = {};
	for (const c of model.components) components[c] = ts.reduce((s, t) => s + t.components[c], 0);
	return { teams: ts, components, total: ts.reduce((s, t) => s + t.total, 0) };
}

export function predictMatchup(model: EventModel, red: number[], blue: number[]): MatchupPrediction {
	const r = alliance(model, red);
	const b = alliance(model, blue);
	const marginSd = model.sigma * Math.SQRT2;
	const margin = r.total - b.total;
	const all = [...r.teams, ...b.teams];
	const confidence = all.some((t) => t.source === 'field')
		? 'low'
		: all.every((t) => t.source === 'event') && model.rows >= MIN_ROWS_FOR_SIGMA
			? 'high'
			: 'medium';
	return { red: r, blue: b, pRed: phi(margin / marginSd), margin, marginSd, confidence };
}

export interface MatchPrediction {
	/** Probability red wins (pre-match for played matches). */
	pRed: number;
	redScore: number;
	blueScore: number;
	/** Played, non-tie matches: whether the predicted favorite won. */
	correct: boolean | null;
}

/**
 * Predictions for every match of an event. Played matches are predicted from the matches before
 * them only, so hit/miss is an honest out-of-sample record; upcoming ones use `current`.
 */
export function predictAll(
	matches: MatchRow[],
	teams: number[],
	priors: Map<number, ComponentValues>,
	components: string[],
	current: EventModel
): Map<number, MatchPrediction> {
	const out = new Map<number, MatchPrediction>();
	const numbers = (side: MatchRow['red']) => side.teams.map((t) => t.number);
	for (let i = 0; i < matches.length; i++) {
		const m = matches[i];
		if (!m.red.teams.length || !m.blue.teams.length) continue;
		const model = m.played ? fitEventModel(matches.slice(0, i), teams, priors, components) : current;
		if (!model.hasData) continue;
		const p = predictMatchup(model, numbers(m.red), numbers(m.blue));
		const decided = m.played && (m.winner === 'red' || m.winner === 'blue');
		out.set(m.id, {
			pRed: p.pRed,
			redScore: p.red.total,
			blueScore: p.blue.total,
			correct: decided ? (p.pRed >= 0.5) === (m.winner === 'red') : null
		});
	}
	return out;
}
