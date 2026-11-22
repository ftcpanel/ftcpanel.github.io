<script lang="ts" module>
	/** One event's rank in the season view. */
	export interface EventRank {
		name: string;
		/** Short x-axis label (date). */
		label: string;
		rank: number;
		/** Field size, when known. */
		of: number | null;
	}
</script>

<script lang="ts">
	import Chart from '#lib/charts/Chart.svelte';
	import { axisStyle, baseOption } from '#lib/charts/theme.ts';
	import type { RankPoint } from '#lib/model/rankHistory.ts';
	import Segmented from './Segmented.svelte';
	let {
		event,
		eventName,
		season
	}: {
		/** Rank after each match at the current / latest event. */
		event: RankPoint[];
		eventName: string | null;
		/** Final (or current) rank at each event this season. */
		season: EventRank[];
	} = $props();

	// Until the user picks, show this event once it has matches, else the season.
	let picked = $state<'event' | 'season' | null>(null);
	const view = $derived(picked ?? (event.length > 0 || season.length === 0 ? 'event' : 'season'));

	const points = $derived(
		view === 'event'
			? event.map((p) => ({ label: p.label, rank: p.rank, of: p.of as number | null, name: p.label }))
			: season.map((s) => ({ label: s.label, rank: s.rank, of: s.of, name: s.name }))
	);
	const latest = $derived(points.at(-1));
	const best = $derived(points.length ? Math.min(...points.map((p) => p.rank)) : null);
	const field = $derived(Math.max(2, ...points.map((p) => p.of ?? p.rank + 1)));
</script>

<section class="card p-5 sm:p-6" aria-label="Rank">
	<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
		<div>
			<h2 class="text-lg font-semibold tracking-tight">Rank</h2>
			<p class="text-sm text-muted">
				{view === 'event' ? `After each match${eventName ? ` · ${eventName}` : ''}` : 'Qualification rank at each event this season'}
			</p>
		</div>
		<Segmented
			bind:value={() => view, (v) => (picked = v)}
			class="w-56"
			options={[
				{ value: 'event', label: 'This event' },
				{ value: 'season', label: 'Season' }
			]}
		/>
	</div>

	{#if points.length === 0}
		<p class="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">
			{view === 'event' ? 'No qualification matches played at this event yet.' : 'No ranked events this season yet.'}
		</p>
	{:else}
		<div class="mb-3 flex flex-wrap gap-x-8 gap-y-2">
			<div>
				<p class="text-xs text-muted">{view === 'event' ? 'Now' : 'Latest'}</p>
				<p class="font-display text-4xl leading-none text-accent">{latest?.rank}{#if latest?.of}<span class="text-lg text-muted">/{latest.of}</span>{/if}</p>
			</div>
			<div>
				<p class="text-xs text-muted">Best</p>
				<p class="font-display text-4xl leading-none">{best}</p>
			</div>
		</div>
		<Chart
			label="Rank over time; 1 is best"
			height={220}
			option={(t) => ({
				...baseOption(t),
				tooltip: {
					...baseOption(t).tooltip,
					trigger: 'axis',
					formatter: (params: { dataIndex: number }[]) => {
						const p = points[params[0].dataIndex];
						return `${p.name}<br/><b>Rank ${p.rank}</b>${p.of ? ` of ${p.of}` : ''}`;
					}
				},
				grid: { left: 4, right: 16, top: 12, bottom: 4, containLabel: true },
				xAxis: { type: 'category', data: points.map((p) => p.label), boundaryGap: view === 'season', ...axisStyle(t), splitLine: { show: false } },
				// Rank 1 at the top. The axis starts at 0 (unlabelled) so ticks land on round numbers.
				yAxis: { type: 'value', inverse: true, min: 0, max: field, minInterval: 1, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => (v === 0 ? '' : String(v)) } },
				series: [
					{
						type: 'line',
						data: points.map((p) => p.rank),
						step: view === 'event' ? 'end' : undefined,
						smooth: view === 'season' ? 0.3 : false,
						symbol: 'circle',
						symbolSize: 8,
						lineStyle: { color: t.accent, width: 2.5 },
						itemStyle: { color: t.accent, borderColor: t.surface, borderWidth: 2 },
						areaStyle: {
							origin: 'end',
							color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${t.accent}40` }, { offset: 1, color: `${t.accent}00` }] }
						}
					}
				]
			})}
		/>
	{/if}
</section>
