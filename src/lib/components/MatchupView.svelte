<script lang="ts">
	import type { Snippet } from 'svelte';
	import Chart from '#lib/charts/Chart.svelte';
	import { glass } from '#lib/glass/layer.ts';
	import { axisStyle, baseOption } from '#lib/charts/theme.ts';
	import { num, pct } from '#lib/format.ts';
	import type { MatchupPrediction, StrengthSource } from '#lib/model/matchup.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';
	import type { AllianceColor, AllianceScore } from '#lib/types.ts';

	let {
		prediction: p,
		season,
		names,
		perspective = null,
		actual = null,
		header
	}: {
		prediction: MatchupPrediction;
		season: SeasonInfo;
		names: Map<number, string>;
		/** The user's team; phrases edges from its alliance's point of view. */
		perspective?: number | null;
		/** Scores, when the match has been played (the prediction is then pre-match). */
		actual?: { red: AllianceScore; blue: AllianceScore } | null;
		/** Rendered at the top of the hero panel (title, alliance pickers). */
		header?: Snippet;
	} = $props();

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
	const dot = { red: 'bg-red-al', blue: 'bg-blue-al' };
</script>

<!-- Headline prediction on the page gradient -->
<section class="relative text-white" aria-label="Prediction">
	{@render header?.()}

	<div class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
		<div>
			<p class="text-white/80">
				{#if mySide}
					{actual ? 'Before the match, your alliance had' : 'Your alliance wins'}
				{:else}
					{actual ? 'Before the match, the favorite had' : 'Favorite wins'}
				{/if}
			</p>
			<div class="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
				<p class="font-display text-8xl leading-none sm:text-9xl">
					{Math.round(pFocus * 100)}<span class="text-5xl sm:text-6xl">%</span>
				</p>
				<span {@attach glass()} class="glass mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
					<span class="size-2.5 rounded-full {dot[focus]} ring-2 ring-white/80"></span>
					{focus === 'red' ? 'Red' : 'Blue'} alliance
				</span>
			</div>
		</div>
		<dl class="grid grid-cols-3 gap-2 sm:gap-3">
			<div {@attach glass()} class="glass rounded-3xl px-3 py-3 sm:px-4">
				<dt class="text-xs text-white/75">Predicted</dt>
				<dd class="mt-1 font-display text-xl whitespace-nowrap sm:text-2xl">{Math.round(p.red.total)}–{Math.round(p.blue.total)}</dd>
			</div>
			{#if actual}
				<div {@attach glass()} class="glass rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-white/75">Actual</dt>
					<dd class="mt-1 font-display text-xl whitespace-nowrap sm:text-2xl">{actual.red.np}–{actual.blue.np}</dd>
				</div>
			{:else}
				<div {@attach glass()} class="glass rounded-3xl px-3 py-3 sm:px-4">
					<dt class="text-xs text-white/75">Margin</dt>
					<dd class="mt-1 font-display text-xl sm:text-2xl">±{num(p.marginSd, 0)}</dd>
				</div>
			{/if}
			<div {@attach glass()} class="glass rounded-3xl px-3 py-3 sm:px-4">
				<dt class="text-xs text-white/75">Confidence</dt>
				<dd class="mt-1 font-display text-xl capitalize sm:text-2xl">{p.confidence}</dd>
			</div>
		</dl>
	</div>

	<div class="mt-6">
		<div class="flex h-3.5 gap-1 rounded-full bg-white/25 p-0.5" role="img" aria-label="Red {pct(p.pRed)}, Blue {pct(1 - p.pRed)}">
			<span class="rounded-full bg-red-al transition-[width] duration-700" style:width="{p.pRed * 100}%"></span>
			<span class="flex-1 rounded-full bg-blue-al"></span>
		</div>
		<div class="mt-2 flex justify-between text-sm font-medium text-white/90">
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
			option={(t) => ({
				...baseOption(t),
				tooltip: { ...baseOption(t).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(127,127,127,0.08)' } }, valueFormatter: (v: unknown) => num(Number(v)) },
				grid: { left: 4, right: 12, top: 4, bottom: 4, containLabel: true },
				xAxis: { type: 'value', ...axisStyle(t) },
				yAxis: { type: 'category', inverse: true, data: season.components.map((c) => c.label), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: t.ink, fontSize: 12 } },
				series: (['red', 'blue'] as const).map((side) => ({
					name: side === 'red' ? 'Red' : 'Blue',
					type: 'bar',
					barGap: '30%',
					barMaxWidth: 14,
					itemStyle: { color: side === 'red' ? t.red : t.blue, borderRadius: 7 },
					data: season.components.map((c) => Math.round(p[side].components[c.key] * 10) / 10)
				}))
			})}
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
					series: (['red', 'blue'] as const).map((side) => {
						const color = side === 'red' ? t.red : t.blue;
						const mu = p[side].total;
						return {
							name: side === 'red' ? 'Red' : 'Blue',
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
									align: mu <= p[side === 'red' ? 'blue' : 'red'].total ? 'right' : 'left',
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
		<p class="mt-1 mb-4 text-sm text-muted">Each team's estimated points per phase.</p>
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
						<span class="size-2 shrink-0 rounded-full {x.side === 'red' ? 'bg-red-al' : 'bg-blue-al'}"></span>
						<span class="min-w-0 flex-1">
							<a href="/teams/{x.team}" class="block truncate text-sm hover:text-accent hover:underline"><span class="font-semibold">{x.team}</span> {names.get(x.team) ?? ''}</a>
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

	{#if actual}
		<section class="card p-5 sm:p-6 lg:col-span-2">
			<h2 class="mb-4 text-lg font-semibold tracking-tight">Predicted vs actual</h2>
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
							<td class="py-2.5 text-right font-semibold">{actual.red.components[c.key]}</td>
							<td class="py-2.5 text-right text-muted">{num(p.blue.components[c.key])}</td>
							<td class="py-2.5 text-right font-semibold">{actual.blue.components[c.key]}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
</div>
