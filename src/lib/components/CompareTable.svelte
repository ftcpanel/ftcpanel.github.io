<script lang="ts">
	import { num, record } from '#lib/format.ts';
	import { slotColor, type CompareTeam } from '#lib/model/compare.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';

	let {
		columns,
		season
	}: {
		/** One column per compared team; `team` is null while loading. */
		columns: { number: number; slot: number; team: CompareTeam | null }[];
		season: SeasonInfo;
	} = $props();

	interface Cell {
		main: string;
		sub?: string;
		/** Higher is better; null = not comparable. */
		score: number | null;
	}
	interface Row {
		label: string;
		cell: (t: CompareTeam) => Cell;
		/** Highlight the best value (false for rows where more isn't better). */
		best: boolean;
	}

	const seasonCell = (s: { value: number; rank: number } | undefined, count: number | undefined): Cell =>
		s ? { main: num(s.value), sub: `#${s.rank.toLocaleString()} of ${count?.toLocaleString()}`, score: s.value } : { main: '–', score: null };

	// Season quick stats come as auto / dc / eg in the season's component order.
	const compKeys = ['auto', 'dc', 'eg'] as const;
	const rows: Row[] = $derived([
		{ label: 'Season OPR', best: true, cell: (t) => seasonCell(t.season?.tot, t.season?.count) },
		...season.components.slice(0, 3).map(
			(c, i): Row => ({ label: c.label, best: true, cell: (t) => seasonCell(t.season?.[compKeys[i]], t.season?.count) })
		),
		{
			label: 'Best event OPR',
			best: true,
			cell: (t) =>
				t.bestEvent
					? { main: num(t.bestEvent.stats.oprNp), sub: t.bestEvent.name, score: t.bestEvent.stats.oprNp }
					: { main: '–', score: null }
		},
		{
			label: 'Avg score',
			best: true,
			cell: (t) =>
				t.latest ? { main: num(t.latest.stats.avgNp), sub: t.latest.name, score: t.latest.stats.avgNp } : { main: '–', score: null }
		},
		{
			label: 'Record',
			best: true,
			cell: (t) => {
				const played = t.record.wins + t.record.losses + t.record.ties;
				const rate = played ? (t.record.wins + t.record.ties / 2) / played : null;
				return { main: record(t.record), sub: rate === null ? undefined : `${Math.round(rate * 100)}% wins`, score: rate };
			}
		},
		{ label: 'Events played', best: false, cell: (t) => ({ main: String(t.events.length), score: null }) },
		{
			label: 'Best score',
			best: true,
			cell: (t) => ({ main: t.bestScore === null ? '–' : String(Math.round(t.bestScore)), score: t.bestScore })
		}
	]);

	const grid = $derived(
		rows.map((row) => {
			const cells = columns.map((c) => (c.team ? row.cell(c.team) : null));
			const scores = cells.map((c) => c?.score).filter((s): s is number => s != null);
			const top = row.best && scores.length >= 2 ? Math.max(...scores) : null;
			return { label: row.label, cells: cells.map((c) => (c ? { ...c, best: top !== null && c.score === top } : null)) };
		})
	);
</script>

<section class="card p-5 sm:p-6" aria-label="Stats">
	<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
		<h2 class="text-lg font-semibold tracking-tight">Stats</h2>
		<p class="flex items-center gap-1.5 text-xs text-muted">
			<span class="size-1.5 rounded-full bg-accent"></span> Best in row · OPR is non-penalty
		</p>
	</div>
	<!-- Phones: stacked blocks, one stat per block with the teams side by side underneath. -->
	<div class="sm:hidden" style:--n={columns.length}>
		<div class="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-1.5">
			{#each columns as c (c.number)}
				<a href="/teams/{c.number}" class="chip flex min-w-0 items-center justify-center gap-1.5 rounded-full px-1.5 py-1.5 text-xs font-semibold" title={c.team?.name}>
					<span class="size-2 shrink-0 rounded-full" style:background={slotColor(c.slot)}></span>
					{c.number}
				</a>
			{/each}
		</div>
		{#each grid as row (row.label)}
			<div class="mt-3 border-t border-line pt-2.5">
				<p class="mb-1 text-xs font-medium text-muted">{row.label}</p>
				<div class="grid grid-cols-[repeat(var(--n),minmax(0,1fr))] gap-1.5">
					{#each row.cells as cell, i (columns[i].number)}
						<div class="min-w-0 px-0.5">
							{#if cell}
								<span class="flex items-center gap-1 {cell.best ? 'font-semibold' : ''}">
									<span class="min-w-0 font-display text-base leading-6 wrap-anywhere {cell.best ? 'font-medium' : ''}">{cell.main}</span>
									{#if cell.best}<span class="size-1.5 shrink-0 rounded-full bg-accent" aria-label="best"></span>{/if}
								</span>
								{#if cell.sub}<span class="line-clamp-3 text-[11px] leading-tight break-words text-muted" title={cell.sub}>{cell.sub}</span>{/if}
							{:else}
								<span class="block h-6 w-full max-w-14 animate-pulse rounded-lg bg-surface-2"></span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
	<!-- From sm up: a table; 3–4 teams scroll sideways on narrow screens with the label column pinned. -->
	<div class="hidden overflow-x-auto sm:block">
		<table class="w-full border-separate border-spacing-0 text-sm {columns.length > 2 ? 'min-w-[34rem]' : ''}">
			<thead>
				<tr>
					<th class="sticky left-0 z-10 w-28 bg-surface sm:w-40"><span class="sr-only">Stat</span></th>
					{#each columns as c (c.number)}
						<th class="px-2 pb-3 text-left align-bottom font-normal sm:px-3">
							<span class="mb-2 block h-1 rounded-full" style:background={slotColor(c.slot)}></span>
							<a href="/teams/{c.number}" class="block min-w-0 hover:text-accent">
								<span class="block font-semibold">{c.number}</span>
								<span class="block truncate text-xs text-muted">{c.team?.name ?? '…'}</span>
							</a>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each grid as row (row.label)}
					<tr>
						<th scope="row" class="sticky left-0 z-10 border-t border-line bg-surface py-3 pr-2 text-left align-top text-xs font-medium text-muted sm:text-sm">
							{row.label}
						</th>
						{#each row.cells as cell, i (columns[i].number)}
							<td class="border-t border-line px-2 py-3 align-top sm:px-3">
								{#if cell}
									<span class="flex items-center gap-1.5 {cell.best ? 'font-semibold' : ''}">
										<span class="font-display text-lg leading-6 sm:text-xl {cell.best ? 'font-medium' : ''}">{cell.main}</span>
										{#if cell.best}<span class="size-1.5 shrink-0 rounded-full bg-accent" aria-label="best"></span>{/if}
									</span>
									{#if cell.sub}<span class="mt-0.5 line-clamp-2 text-xs text-muted" title={cell.sub}>{cell.sub}</span>{/if}
								{:else}
									<span class="block h-6 w-14 animate-pulse rounded-lg bg-surface-2"></span>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
