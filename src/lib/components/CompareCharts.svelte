<script lang="ts">
	import Chart from '#lib/charts/Chart.svelte';
	import { axisStyle, baseOption } from '#lib/charts/theme.ts';
	import { dateRange, num } from '#lib/format.ts';
	import { slotColor, type CompareTeam } from '#lib/model/compare.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';

	let { teams, season }: { teams: CompareTeam[]; season: SeasonInfo } = $props();

	const withEvents = $derived(teams.filter((t) => t.events.length > 0));
	const withSeason = $derived(teams.filter((t) => t.season));
	const comps = $derived(season.components.slice(0, 3));
	const compKeys = ['auto', 'dc', 'eg'] as const;
</script>

{#snippet legend(list: CompareTeam[])}
	<ul class="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
		{#each list as t (t.number)}
			<li class="flex items-center gap-1.5">
				<span class="size-2.5 rounded-full" style:background={slotColor(t.slot)}></span>
				<span class="font-semibold">{t.number}</span>
				<span class="max-w-32 truncate text-muted">{t.name}</span>
			</li>
		{/each}
	</ul>
{/snippet}

<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
	<section class="card min-w-0 p-5 sm:p-6" aria-label="OPR by event">
		<h2 class="text-lg font-semibold tracking-tight">OPR by event</h2>
		<p class="mb-3 text-sm text-muted">Non-penalty OPR at each event this season</p>
		{#if withEvents.length === 0}
			<p class="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">No event results this season yet.</p>
		{:else}
			{@render legend(withEvents)}
			<Chart
				label="OPR at each event this season, one line per team"
				height={260}
				option={(t) => ({
					...baseOption(t),
					tooltip: {
						...baseOption(t).tooltip,
						trigger: 'item',
						formatter: (p: { seriesIndex: number; dataIndex: number }) => {
							const team = withEvents[p.seriesIndex];
							const e = team.events[p.dataIndex];
							return `<b>${team.number}</b> · ${e.name}<br/>${dateRange(e.start, e.start)} · OPR <b>${num(e.stats.oprNp)}</b>`;
						}
					},
					grid: { left: 4, right: 16, top: 12, bottom: 4, containLabel: true },
					xAxis: {
						type: 'time',
						...axisStyle(t),
						splitLine: { show: false },
						axisLabel: { ...axisStyle(t).axisLabel, hideOverlap: true, formatter: '{MMM} {d}' }
					},
					yAxis: { type: 'value', ...axisStyle(t) },
					series: withEvents.map((team) => {
						const color = slotColor(team.slot, t.accent);
						return {
							type: 'line',
							name: String(team.number),
							data: team.events.map((e) => [e.start, e.stats.oprNp]),
							symbol: 'circle',
							symbolSize: 9,
							smooth: 0.2,
							lineStyle: { color, width: 2.5 },
							itemStyle: { color, borderColor: t.surface, borderWidth: 2 },
							emphasis: { focus: 'series' }
						};
					})
				})}
			/>
		{/if}
	</section>

	<section class="card min-w-0 p-5 sm:p-6" aria-label="Scoring breakdown">
		<h2 class="text-lg font-semibold tracking-tight">Scoring breakdown</h2>
		<p class="mb-3 text-sm text-muted">Season OPR by period</p>
		{#if withSeason.length === 0}
			<p class="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">No matches played this season yet.</p>
		{:else}
			{@render legend(withSeason)}
			<Chart
				label="Season OPR for {comps.map((c) => c.label).join(', ')}, grouped by team"
				height={260}
				option={(t) => ({
					...baseOption(t),
					tooltip: {
						...baseOption(t).tooltip,
						trigger: 'axis',
						axisPointer: { type: 'shadow', shadowStyle: { color: `${t.line}80` } },
						valueFormatter: (v: number) => num(v)
					},
					grid: { left: 4, right: 8, top: 12, bottom: 4, containLabel: true },
					xAxis: { type: 'category', data: comps.map((c) => c.label), ...axisStyle(t), splitLine: { show: false } },
					yAxis: { type: 'value', ...axisStyle(t) },
					series: withSeason.map((team) => ({
						type: 'bar',
						name: String(team.number),
						data: comps.map((_, i) => team.season![compKeys[i]].value),
						barMaxWidth: 28,
						barGap: '15%',
						itemStyle: { color: slotColor(team.slot, t.accent), borderRadius: [6, 6, 0, 0] }
					}))
				})}
			/>
		{/if}
	</section>
</div>
