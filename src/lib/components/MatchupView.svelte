<script lang="ts" module>
	export type MatchupMode = 'result' | 'prediction';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import Chart from '#lib/charts/Chart.svelte';
	import { axisStyle, baseOption, type ChartTheme } from '#lib/charts/theme.ts';
	import { num, pct } from '#lib/format.ts';
	import type { MatchupPrediction, StrengthSource } from '#lib/model/matchup.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';
	import type { AllianceColor, AllianceScore, MatchRow } from '#lib/types.ts';

	let {
		prediction: p,
		season,
		names,
		perspective = null,
		match = null,
		mode = $bindable('prediction'),
		header
	}: {
		prediction: MatchupPrediction;
		season: SeasonInfo;
		names: Map<number, string>;
		/** The user's team; phrases edges from its alliance's point of view. */
		perspective?: number | null;
		/** The match being analysed; when played, the prediction is pre-match and the result is shown. */
		match?: MatchRow | null;
		/** Played matches: show the result or the pre-match prediction. */
		mode?: MatchupMode;
		/** Rendered at the top of the hero panel (title, view toggle, alliance pickers). */
		header?: Snippet;
	} = $props();

	const sides = ['red', 'blue'] as const;
	const sideLabel = { red: 'Red', blue: 'Blue' };
	const dot = { red: 'bg-red-al', blue: 'bg-blue-al' };
	const text = { red: 'text-red-al', blue: 'text-blue-al' };
	const other = (s: AllianceColor): AllianceColor => (s === 'red' ? 'blue' : 'red');

	const mySide = $derived.by((): AllianceColor | null => {
		if (perspective === null) return null;
		if (p.red.teams.some((t) => t.team === perspective)) return 'red';
		if (p.blue.teams.some((t) => t.team === perspective)) return 'blue';
		return null;
	});
	const favorite = $derived<AllianceColor>(p.pRed >= 0.5 ? 'red' : 'blue');
	/** The side the headline number speaks for: mine if I'm playing, else the favorite. */
	const focus = $derived<AllianceColor>(mySide ?? favorite);
	const pFocus = $derived(focus === 'red' ? p.pRed : 1 - p.pRed);
	const pFavorite = $derived(favorite === 'red' ? p.pRed : 1 - p.pRed);

	/** Component edges from the perspective side (or red when neutral), largest first. */
	const edges = $derived(
		season.components
			.map((c) => {
				const red = p.red.components[c.key];
				const blue = p.blue.components[c.key];
				const diff = mySide === 'blue' ? blue - red : red - blue;
				return { ...c, red, blue, diff };
			})
			.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
	);
	const ahead = $derived(edges.filter((e) => e.diff >= 1));
	const behind = $derived(edges.filter((e) => e.diff <= -1));

	// ---- Result (played matches) ----

	const result = $derived(
		match?.played && match.red.score && match.blue.score ? { red: match.red.score, blue: match.blue.score } : null
	);
	const showResult = $derived(result !== null && mode === 'result');
	const winner = $derived(match?.winner ?? null);
	const decided = $derived(winner === 'red' || winner === 'blue');
	/** Side the result is told from: mine, else the winner, else red. */
	const resultSide = $derived<AllianceColor>(mySide ?? (winner === 'blue' ? 'blue' : 'red'));
	/** Winner first, so "Blue won 221–107" reads naturally. */
	const lead = $derived<AllianceColor>(winner === 'blue' ? 'blue' : 'red');
	const isQuals = $derived(match?.level === 'Quals');

	function rpOf(side: AllianceColor, score: AllianceScore): number {
		const base = winner === side ? season.winRp.win : winner === 'tie' ? season.winRp.tie : 0;
		return base + season.rps.filter((r) => score.rp[r.key]).length;
	}

	/** Actual per-phase points from the result side's view, in season order. */
	const actualEdges = $derived(
		result
			? season.components.map((c) => {
					const red = result.red.components[c.key];
					const blue = result.blue.components[c.key];
					return { ...c, red, blue, diff: resultSide === 'blue' ? blue - red : red - blue };
				})
			: []
	);
	const wonPhases = $derived(actualEdges.filter((e) => e.diff > 0));
	const lostPhases = $derived(actualEdges.filter((e) => e.diff < 0));

	const sourceLabel: Record<StrengthSource, string> = {
		event: 'This event',
		prior: 'Earlier event',
		field: 'No data yet'
	};

	function normalPdf(x: number, mu: number, sd: number) {
		return Math.exp(-0.5 * ((x - mu) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
	}
	const sd = $derived(p.marginSd / Math.SQRT2);
	const teams = $derived([
		...p.red.teams.map((t) => ({ ...t, side: 'red' as const })),
		...p.blue.teams.map((t) => ({ ...t, side: 'blue' as const }))
	]);

	/** Grouped red/blue bars per scoring phase. */
	function phaseChart(t: ChartTheme, values: Record<AllianceColor, number[]>) {
		return {
			...baseOption(t),
			tooltip: { ...baseOption(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(127,127,127,0.08)' } }, valueFormatter: (v: unknown) => num(Number(v)) },
			grid: { left: 4, right: 12, top: 4, bottom: 4, containLabel: true },
			xAxis: { type: 'value', ...axisStyle(t) },
			yAxis: { type: 'category', inverse: true, data: season.components.map((c) => c.label), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: t.ink, fontSize: 12 } },
			series: sides.map((side) => ({
				name: sideLabel[side],
				type: 'bar',
				barGap: '30%',
				barMaxWidth: 14,
				itemStyle: { color: side === 'red' ? t.red : t.blue, borderRadius: 7 },
				data: values[side]
			}))
		};
	}
</script>

{#if showResult && result && match}
	{@const loser = other(lead)}
	{@const margin = Math.abs(result.red.total - result.blue.total)}
	<!-- Actual result on the page background -->
	<section class="hero relative text-ink" aria-label="Result">
		{@render header?.()}

		<div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
			<div>
				<p class="text-ink/80">
					{#if mySide && decided}
						{winner === mySide ? 'Your alliance won' : 'Your alliance lost'}
					{:else}
						Final score
					{/if}
				</p>
				<div class="mt-2 flex flex-wrap items-end gap-x-4 gap-y-3">
					<span class="mb-2 inline-flex items-center rounded-full px-4 py-1.5 font-display text-2xl text-white {decided ? dot[lead] : 'bg-ink/70'}">
						{decided ? `${sideLabel[lead]} won` : 'Tie'}
					</span>
					<p class="font-display text-7xl leading-none whitespace-nowrap sm:text-8xl lg:text-9xl" aria-label="{sideLabel[lead]} {result[lead].total}, {sideLabel[loser]} {result[loser].total}">
						{result[lead].total}<span class="text-ink/50">–</span>{result[loser].total}
					</p>
				</div>
			</div>
			<dl class="grid grid-cols-3 gap-2 sm:gap-3">
				<div class="chip rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-ink/75">Margin</dt>
					<dd class="mt-1 font-display text-xl sm:text-2xl">{decided ? `+${margin}` : '0'}</dd>
				</div>
				<div class="chip rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-ink/75">No penalties</dt>
					<dd class="mt-1 font-display text-xl whitespace-nowrap sm:text-2xl">{result[lead].np}–{result[loser].np}</dd>
				</div>
				{#if isQuals}
					<div class="chip rounded-3xl px-3 py-3 sm:px-4">
						<dt class="text-xs text-ink/75">Ranking pts</dt>
						<dd class="mt-1 font-display text-xl whitespace-nowrap sm:text-2xl">{rpOf(lead, result[lead])}–{rpOf(loser, result[loser])}</dd>
					</div>
				{:else}
					<div class="chip rounded-3xl px-3 py-3 sm:px-4">
						<dt class="text-xs text-ink/75">Penalties</dt>
						<dd class="mt-1 font-display text-xl whitespace-nowrap sm:text-2xl">{result[lead].penaltyByOpp}–{result[loser].penaltyByOpp}</dd>
					</div>
				{/if}
			</dl>
		</div>

		<!-- Score split, then who played -->
		<div class="mt-6">
			<div class="flex h-3.5 gap-1 rounded-full bg-ink/25 p-0.5" role="img" aria-label="Red {result.red.total}, Blue {result.blue.total}">
				<span class="rounded-full bg-red-al transition-[width] duration-700" style:width="{(result.red.total / Math.max(1, result.red.total + result.blue.total)) * 100}%"></span>
				<span class="flex-1 rounded-full bg-blue-al"></span>
			</div>
			<div class="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-3">
				{#each sides as side (side)}
					{@const won = winner === side}
					<div class="chip flex items-center gap-3 rounded-3xl px-4 py-3 {side === 'blue' ? 'sm:flex-row-reverse sm:text-right' : ''}">
						<span class="size-2.5 shrink-0 rounded-full {dot[side]}" aria-hidden="true"></span>
						<ul class="min-w-0 flex-1 space-y-0.5 text-sm" aria-label="{sideLabel[side]} alliance">
							{#each match[side].teams as t (t.number)}
								<li class="wrap-anywhere">
									<a href="/teams/{t.number}" class="hover:underline {t.noShow || t.dq ? 'line-through opacity-70' : ''}">
										<span class="font-semibold">{t.number}</span>
										<span class="text-ink/80">{names.get(t.number) ?? ''}</span>
									</a>
									{#if t.number === perspective}<span class="ml-1 rounded-full bg-accent px-1.5 text-xs font-semibold text-white">You</span>{/if}
									{#if t.surrogate}<span class="ml-1 text-xs text-ink/70">surrogate</span>{/if}
									{#if t.noShow}<span class="ml-1 text-xs text-ink/70">no show</span>{/if}
									{#if t.dq}<span class="ml-1 text-xs text-ink/70">DQ</span>{/if}
								</li>
							{/each}
						</ul>
						<span class="text-right {side === 'blue' ? 'sm:text-left' : ''}">
							<span class="block font-display text-3xl leading-none {won || !decided ? '' : 'opacity-60'}">{result[side].total}</span>
							<span class="text-xs text-ink/75">{sideLabel[side]}{won ? ' · won' : ''}</span>
						</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- How the pre-match prediction did -->
	<section class="card mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:px-6" aria-label="How the prediction did">
		{#if decided}
			<span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold {favorite === winner ? 'bg-live/15 text-live' : 'bg-warn/15 text-warn'}">
				{favorite === winner ? '✓ Called it' : '✗ Upset'}
			</span>
		{:else}
			<span class="shrink-0 rounded-full bg-line px-2.5 py-1 text-xs font-semibold text-muted">Tie</span>
		{/if}
		<p class="order-last w-full text-sm sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
			Pre-match favorite <span class="font-semibold {text[favorite]}">{sideLabel[favorite]}</span> at {pct(pFavorite)}.
			Predicted <span class="text-red-al">{Math.round(p.red.total)}</span>–<span class="text-blue-al">{Math.round(p.blue.total)}</span>,
			actual <span class="font-semibold text-red-al">{result.red.np}</span>–<span class="font-semibold text-blue-al">{result.blue.np}</span>
			<span class="text-muted">(no penalties)</span>
		</p>
		<button type="button" onclick={() => (mode = 'prediction')} class="ml-auto shrink-0 text-sm font-medium text-accent hover:underline sm:ml-0">
			Full prediction →
		</button>
	</section>

	<div class="mt-4 grid gap-4 lg:mt-6 lg:grid-cols-2 lg:gap-6">
		<!-- Points per phase -->
		<section class="card p-5 sm:p-6">
			<h2 class="text-lg font-semibold tracking-tight">Points per phase</h2>
			<p class="mt-1 mb-4 text-sm text-muted">
				{#if wonPhases.length}{mySide ? 'Your alliance' : sideLabel[resultSide]} outscored {mySide ? 'them' : sideLabel[other(resultSide)]} in {wonPhases.map((e) => `${e.label} (+${e.diff})`).join(', ')}.{/if}
				{#if lostPhases.length}Behind in {lostPhases.map((e) => `${e.label} (${e.diff})`).join(', ')}.{/if}
				{#if !wonPhases.length && !lostPhases.length}Level in every phase.{/if}
			</p>
			<Chart
				label="Actual points per scoring phase for each alliance"
				height={190}
				option={(t) => phaseChart(t, { red: season.components.map((c) => result.red.components[c.key]), blue: season.components.map((c) => result.blue.components[c.key]) })}
			/>
			<ul class="mt-4 space-y-2">
				{#each actualEdges as e (e.key)}
					<li class="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-2.5 text-sm">
						<span class="font-medium">{e.label}</span>
						<span class="flex items-center gap-2">
							<span class="text-red-al">{e.red}</span>
							<span class="text-muted">/</span>
							<span class="text-blue-al">{e.blue}</span>
							<span class="ml-1 w-12 rounded-full px-2 py-0.5 text-center text-xs font-semibold {e.diff > 0 ? 'bg-live/15 text-live' : e.diff < 0 ? 'bg-red-al/15 text-red-al' : 'bg-line text-muted'}">
								{e.diff > 0 ? '+' : ''}{e.diff}
							</span>
						</span>
					</li>
				{/each}
				<li class="flex items-center justify-between rounded-2xl px-4 py-2.5 text-sm ring-1 ring-line">
					<span>
						<span class="font-medium">Penalty points</span>
						<span class="block text-xs text-muted">Awarded for the opponent's fouls</span>
					</span>
					<span class="flex items-center gap-2">
						<span class="text-red-al">{result.red.penaltyByOpp}</span>
						<span class="text-muted">/</span>
						<span class="text-blue-al">{result.blue.penaltyByOpp}</span>
						<span class="ml-1 w-12"></span>
					</span>
				</li>
			</ul>
			<p class="mt-3 px-1 text-xs text-muted">
				Edges from {mySide ? 'your alliance' : `${sideLabel[resultSide]}`}'s side.
			</p>
		</section>

		<!-- Full scoring breakdown -->
		<section class="card p-5 sm:p-6">
			<h2 class="mb-2 text-lg font-semibold tracking-tight">Scoring breakdown</h2>
			<table class="w-full text-sm">
				<thead>
					<tr>
						<th class="eyebrow py-2 text-left font-normal text-muted">Item</th>
						<th class="eyebrow w-16 py-2 text-right font-normal text-red-al">Red</th>
						<th class="eyebrow w-16 py-2 text-right font-normal text-blue-al">Blue</th>
					</tr>
				</thead>
				<tbody>
					{#each result.red.breakdown as [label, value], i (label)}
						<tr class="border-t border-line/60">
							<td class="py-1.5 font-sans">{label}</td>
							<td class="py-1.5 text-right">{value}</td>
							<td class="py-1.5 text-right">{result.blue.breakdown[i]?.[1] ?? '–'}</td>
						</tr>
					{/each}
					<tr class="border-t border-line font-semibold">
						<td class="py-2 font-sans">Score (no penalties)</td>
						<td class="py-2 text-right">{result.red.np}</td>
						<td class="py-2 text-right">{result.blue.np}</td>
					</tr>
					<tr class="border-t border-line/60">
						<td class="py-1.5 font-sans">Penalty points from opponent</td>
						<td class="py-1.5 text-right">{result.red.penaltyByOpp}</td>
						<td class="py-1.5 text-right">{result.blue.penaltyByOpp}</td>
					</tr>
					<tr class="border-t border-line font-semibold">
						<td class="py-2 font-sans">Final score</td>
						<td class="py-2 text-right {winner === 'red' ? 'text-red-al' : ''}">{result.red.total}</td>
						<td class="py-2 text-right {winner === 'blue' ? 'text-blue-al' : ''}">{result.blue.total}</td>
					</tr>
					{#if isQuals}
						<tr class="border-t border-line/60">
							<td class="py-1.5 font-sans">{winner === 'tie' ? 'Tie' : 'Win'} RP</td>
							{#each sides as side (side)}
								<td class="py-1.5 text-right">{winner === side ? season.winRp.win : winner === 'tie' ? season.winRp.tie : 0}</td>
							{/each}
						</tr>
						{#each season.rps as rp (rp.key)}
							<tr class="border-t border-line/60">
								<td class="py-1.5 font-sans">{rp.label} RP</td>
								<td class="py-1.5 text-right">{result.red.rp[rp.key] ? '✓' : '–'}</td>
								<td class="py-1.5 text-right">{result.blue.rp[rp.key] ? '✓' : '–'}</td>
							</tr>
						{/each}
						<tr class="border-t border-line font-semibold">
							<td class="py-2 font-sans">Ranking points</td>
							<td class="py-2 text-right">{rpOf('red', result.red)}</td>
							<td class="py-2 text-right">{rpOf('blue', result.blue)}</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</section>

		<!-- Predicted vs actual, phase by phase -->
		<section class="card p-5 sm:p-6 lg:col-span-2">
			<h2 class="text-lg font-semibold tracking-tight">Predicted vs actual</h2>
			<p class="mt-1 mb-3 text-sm text-muted">Pre-match model, fitted on the matches before this one. No-penalty points.</p>
			<table class="w-full text-sm">
				<thead>
					<tr>
						<th class="eyebrow py-2 text-left font-normal text-muted">Phase</th>
						<th class="eyebrow py-2 text-right font-normal text-red-al">Red pred.</th>
						<th class="eyebrow py-2 text-right font-normal text-red-al">Actual</th>
						<th class="eyebrow py-2 text-right font-normal text-blue-al">Blue pred.</th>
						<th class="eyebrow py-2 text-right font-normal text-blue-al">Actual</th>
					</tr>
				</thead>
				<tbody>
					{#each season.components as c (c.key)}
						<tr class="border-t border-line">
							<td class="py-2.5 font-sans">{c.label}</td>
							<td class="py-2.5 text-right text-muted">{num(p.red.components[c.key])}</td>
							<td class="py-2.5 text-right font-semibold">{result.red.components[c.key]}</td>
							<td class="py-2.5 text-right text-muted">{num(p.blue.components[c.key])}</td>
							<td class="py-2.5 text-right font-semibold">{result.blue.components[c.key]}</td>
						</tr>
					{/each}
					<tr class="border-t border-line font-semibold">
						<td class="py-2.5 font-sans">Total</td>
						<td class="py-2.5 text-right text-muted">{num(p.red.total)}</td>
						<td class="py-2.5 text-right">{result.red.np}</td>
						<td class="py-2.5 text-right text-muted">{num(p.blue.total)}</td>
						<td class="py-2.5 text-right">{result.blue.np}</td>
					</tr>
				</tbody>
			</table>
		</section>
	</div>
{:else}
	<!-- Headline prediction on the page background -->
	<section class="hero relative text-ink" aria-label="Prediction">
		{@render header?.()}

		<div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
			<div>
				<p class="text-ink/80">
					{#if mySide}
						{result ? 'Before the match, your alliance had' : 'Your alliance wins'}
					{:else}
						{result ? 'Before the match, the favorite had' : 'Favorite wins'}
					{/if}
				</p>
				<div class="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
					<p class="font-display text-8xl leading-none sm:text-9xl">
						{Math.round(pFocus * 100)}<span class="text-5xl sm:text-6xl">%</span>
					</p>
					<span class="chip mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
						<span class="size-2.5 rounded-full {dot[focus]}"></span>
						{sideLabel[focus]} alliance
					</span>
				</div>
			</div>
			<dl class="grid grid-cols-3 gap-2 sm:gap-3">
				<div class="chip rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-ink/75">Predicted</dt>
					<dd class="mt-1 font-display text-xl whitespace-nowrap sm:text-2xl">{Math.round(p.red.total)}–{Math.round(p.blue.total)}</dd>
				</div>
				<div class="chip rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-ink/75">Margin</dt>
					<dd class="mt-1 font-display text-xl sm:text-2xl">±{num(p.marginSd, 0)}</dd>
				</div>
				<div class="chip rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-ink/75">Confidence</dt>
					<dd class="mt-1 font-display text-xl capitalize sm:text-2xl">{p.confidence}</dd>
				</div>
			</dl>
		</div>

		<div class="mt-6">
			<div class="flex h-3.5 gap-1 rounded-full bg-ink/25 p-0.5" role="img" aria-label="Red {pct(p.pRed)}, Blue {pct(1 - p.pRed)}">
				<span class="rounded-full bg-red-al transition-[width] duration-700" style:width="{p.pRed * 100}%"></span>
				<span class="flex-1 rounded-full bg-blue-al"></span>
			</div>
			<div class="mt-2 flex justify-between text-sm font-medium text-ink/90">
				<span>Red {pct(p.pRed)}</span>
				<span>{pct(1 - p.pRed)} Blue</span>
			</div>
		</div>
	</section>

	<div class="mt-8 grid gap-4 lg:grid-cols-2 lg:gap-6">
		<!-- Where it's decided -->
		<section class="card p-5 sm:p-6">
			<h2 class="text-lg font-semibold tracking-tight">Where it's decided</h2>
			<p class="mt-1 mb-4 text-sm text-muted">
				{#if mySide}
					{#if ahead.length}Stronger in {ahead.map((e) => `${e.label} (+${num(e.diff, 0)})`).join(', ')}.{/if}
					{#if behind.length}Weaker in {behind.map((e) => `${e.label} (${num(e.diff, 0)})`).join(', ')}.{/if}
					{#if !ahead.length && !behind.length}Even across every phase.{/if}
				{:else}
					Predicted points per phase.
				{/if}
			</p>
			<Chart
				label="Predicted points per scoring phase for each alliance"
				height={190}
				option={(t) => phaseChart(t, { red: season.components.map((c) => Math.round(p.red.components[c.key] * 10) / 10), blue: season.components.map((c) => Math.round(p.blue.components[c.key] * 10) / 10) })}
			/>
			<ul class="mt-4 space-y-2">
				{#each edges as e (e.key)}
					<li class="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-2.5 text-sm">
						<span class="font-medium">{e.label}</span>
						<span class="flex items-center gap-2">
							<span class="text-red-al">{num(e.red)}</span>
							<span class="text-muted">/</span>
							<span class="text-blue-al">{num(e.blue)}</span>
							{#if mySide}
								<span class="ml-1 w-12 rounded-full px-2 py-0.5 text-center text-xs font-semibold {e.diff >= 1 ? 'bg-live/15 text-live' : e.diff <= -1 ? 'bg-red-al/15 text-red-al' : 'bg-line text-muted'}">
									{Math.round(e.diff) > 0 ? '+' : ''}{Math.round(e.diff) || 0}
								</span>
							{/if}
						</span>
					</li>
				{/each}
			</ul>
		</section>

		<!-- Score distribution -->
		<section class="card p-5 sm:p-6">
			<h2 class="text-lg font-semibold tracking-tight">Score range</h2>
			<p class="mt-1 mb-4 text-sm text-muted">Likely scores for each alliance. More overlap means a closer match.</p>
			<Chart
				label="Overlapping predicted score distributions for red and blue"
				height={250}
				option={(t) => {
					const lo = Math.max(0, Math.min(p.red.total, p.blue.total) - 3 * sd);
					const hi = Math.max(p.red.total, p.blue.total) + 3 * sd;
					const xs = Array.from({ length: 81 }, (_, i) => lo + ((hi - lo) * i) / 80);
					return {
						...baseOption(t),
						tooltip: { show: false },
						grid: { left: 4, right: 12, top: 28, bottom: 4, containLabel: true },
						xAxis: { type: 'value', min: Math.floor(lo / 10) * 10, max: Math.ceil(hi / 10) * 10, ...axisStyle(t), splitLine: { show: false } },
						yAxis: { type: 'value', show: false },
						series: sides.map((side) => {
							const color = side === 'red' ? t.red : t.blue;
							const mu = p[side].total;
							return {
								name: sideLabel[side],
								type: 'line',
								smooth: true,
								showSymbol: false,
								lineStyle: { color, width: 2.5 },
								itemStyle: { color },
								areaStyle: {
									color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${color}55` }, { offset: 1, color: `${color}00` }] }
								},
								data: xs.map((x) => [x, normalPdf(x, mu, sd)]),
								markLine: {
									symbol: 'none',
									silent: true,
									lineStyle: { color, type: [3, 4], width: 1.5 },
									// Lower mean labels to the left of its line, higher to the right, so close means don't collide.
									label: {
										color,
										position: 'end',
										align: mu <= p[other(side)].total ? 'right' : 'left',
										padding: [0, 6],
										formatter: () => String(Math.round(mu))
									},
									data: [{ xAxis: mu }]
								}
							};
						})
					};
				}}
			/>
		</section>

		<!-- Team contributions -->
		<section class="card p-5 sm:p-6 lg:col-span-2">
			<h2 class="text-lg font-semibold tracking-tight">Team contributions</h2>
			<p class="mt-1 mb-4 text-sm text-muted">Each team's estimated points per phase{result ? ' going into the match' : ''}.</p>
			<div class="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
				<Chart
					label="Stacked estimated points per phase for each team"
					height={220}
					option={(t) => ({
						...baseOption(t),
						tooltip: { ...baseOption(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(127,127,127,0.08)' } }, valueFormatter: (v: unknown) => num(Number(v)) },
						legend: { top: 0, left: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, itemGap: 16, textStyle: { color: t.muted, fontSize: 12 } },
						grid: { left: 4, right: 12, top: 32, bottom: 4, containLabel: true },
						xAxis: { type: 'value', ...axisStyle(t) },
						yAxis: {
							type: 'category',
							inverse: true,
							data: teams.map((x) => String(x.team)),
							axisTick: { show: false },
							axisLine: { show: false },
							axisLabel: { fontWeight: 600, color: (_: unknown, i: number) => (teams[i]?.side === 'red' ? t.red : t.blue) }
						},
						series: season.components.map((c, i) => ({
							name: c.label,
							type: 'bar',
							stack: 'total',
							barMaxWidth: 18,
							itemStyle: { color: t.comps[i], borderRadius: i === season.components.length - 1 ? [0, 9, 9, 0] : i === 0 ? [9, 0, 0, 9] : 0, borderColor: t.surface, borderWidth: 1 },
							data: teams.map((x) => Math.round(Math.max(0, x.components[c.key]) * 10) / 10)
						}))
					})}
				/>
				<ul class="space-y-2 self-start">
					{#each teams as x (x.team)}
						<li class="flex items-center gap-3 rounded-2xl px-4 py-2.5 {x.team === perspective ? 'bg-accent-soft' : 'bg-surface-2'}">
							<span class="size-2 shrink-0 rounded-full {dot[x.side]}"></span>
							<span class="min-w-0 flex-1">
								<a href="/teams/{x.team}" class="line-clamp-2 text-sm wrap-anywhere hover:text-accent hover:underline"><span class="font-semibold">{x.team}</span> {names.get(x.team) ?? ''}</a>
								<span class="text-xs {x.source === 'field' ? 'text-warn' : 'text-muted'}">
									{sourceLabel[x.source]}{x.matches ? ` · ${x.matches} matches` : ''}
								</span>
							</span>
							<span class="font-display text-xl">{num(x.total)}</span>
						</li>
					{/each}
				</ul>
			</div>
		</section>
	</div>
{/if}
