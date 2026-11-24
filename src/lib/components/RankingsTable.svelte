<script lang="ts">
	import { num, pct, record } from '#lib/format.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';
	import type { RankingRow } from '#lib/types.ts';
	import Icon from './Icon.svelte';

	let {
		rows,
		season,
		highlight = null
	}: { rows: RankingRow[]; season: SeasonInfo; highlight?: number | null } = $props();

	type SortKey = 'rank' | 'team' | 'rs' | 'oprNp' | 'avgNp' | 'maxNp' | `opr.${string}`;
	let sortKey = $state<SortKey>('rank');
	let desc = $state(false);

	function value(r: RankingRow, key: SortKey): number {
		if (key === 'team') return r.team;
		const s = r.stats;
		if (!s) return NaN;
		if (key.startsWith('opr.')) return s.opr[key.slice(4)];
		return s[key as 'rank' | 'rs' | 'oprNp' | 'avgNp' | 'maxNp'];
	}

	const sorted = $derived.by(() => {
		const dir = desc ? -1 : 1;
		return [...rows].sort((a, b) => {
			const va = value(a, sortKey);
			const vb = value(b, sortKey);
			// Unranked teams always sink to the bottom.
			if (Number.isNaN(va) !== Number.isNaN(vb)) return Number.isNaN(va) ? 1 : -1;
			return (va - vb) * dir || a.team - b.team;
		});
	});
	const maxOpr = $derived(Math.max(1, ...rows.map((r) => r.stats?.oprNp ?? 0).filter((v) => !Number.isNaN(v))));

	function sortBy(key: SortKey) {
		if (sortKey === key) desc = !desc;
		else {
			sortKey = key;
			desc = key !== 'rank' && key !== 'team';
		}
	}

	const columns: { key: SortKey; label: string; title: string }[] = $derived([
		{ key: 'rs', label: 'RS', title: 'Ranking score' },
		...season.components.map((c) => ({
			key: `opr.${c.key}` as SortKey,
			label: c.short,
			title: `${c.label} OPR`
		})),
		{ key: 'avgNp', label: 'Avg', title: 'Average alliance score (no penalties)' },
		{ key: 'maxNp', label: 'High', title: 'Highest alliance score (no penalties)' }
	]);

	let expanded = $state<number | null>(null);
</script>

{#snippet sortHeader(key: SortKey, label: string, title: string, align = 'left')}
	<th class="px-1.5 py-2 font-normal" aria-sort={sortKey === key ? (desc ? 'descending' : 'ascending') : undefined}>
		<button
			type="button"
			{title}
			onclick={() => sortBy(key)}
			class="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition {align === 'right' ? 'flex-row-reverse' : ''} {sortKey === key
				? 'bg-ink text-bg'
				: 'text-muted hover:bg-surface-2 hover:text-ink'}"
		>
			{label}
			{#if sortKey === key}<Icon name="chevron" class="size-3 {desc ? '' : 'rotate-180'}" />{/if}
		</button>
	</th>
{/snippet}

{#snippet oprBar(v: number | undefined)}
	<span class="flex items-center justify-end gap-2.5">
		<span class="hidden h-1.5 w-14 overflow-hidden rounded-full bg-surface-2 2xl:block">
			<span class="block h-full rounded-full bg-accent" style:width="{Math.max(0, ((v ?? 0) / maxOpr) * 100)}%"></span>
		</span>
		<span class="w-10 text-right font-semibold">{num(v)}</span>
	</span>
{/snippet}

{#if rows.length === 0}
	<p class="card p-8 text-center text-sm text-muted">No teams registered yet.</p>
{:else}
	<!-- md+: full sortable table -->
	<div class="card hidden overflow-hidden p-2 md:block">
		<div class="flex items-baseline justify-between px-4 pt-3 pb-1">
			<h2 class="text-lg font-semibold tracking-tight">Rankings</h2>
			<p class="text-xs text-muted">Tap a column to sort</p>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="text-left">
					<tr>
						{@render sortHeader('rank', '#', 'Rank')}
						{@render sortHeader('team', 'Team', 'Team number')}
						<th class="px-2.5 py-2 text-xs font-medium text-muted">W-L-T</th>
						{@render sortHeader('oprNp', 'OPR', 'Offensive power rating (no penalties)', 'right')}
						{#each columns as col (col.key)}
							{@render sortHeader(col.key, col.label, col.title, 'right')}
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each sorted as r (r.team)}
						{@const mine = r.team === highlight}
						<tr class="transition {mine ? 'bg-accent-soft' : 'hover:bg-surface-2'} [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl">
							<td class="w-12 py-3 pr-1 pl-5">
								<span class="font-display text-xl {mine ? 'text-accent' : ''}">{r.stats?.rank ?? '–'}</span>
							</td>
							<td class="max-w-64 px-2 py-3">
								<a href="/teams/{r.team}" class="flex min-w-0 items-baseline gap-2 hover:text-accent hover:underline">
									<span class="font-semibold">{r.team}</span>
									<span class="truncate">{r.name}</span>
								</a>
								<span class="block truncate text-xs text-muted">{r.location}</span>
							</td>
							<td class="px-2.5 py-3 whitespace-nowrap text-muted">{r.stats ? record(r.stats) : '–'}</td>
							<td class="px-2 py-3">{@render oprBar(r.stats?.oprNp)}</td>
							{#each columns as col (col.key)}
								<td class="px-2.5 py-3 text-right {col.key === sortKey ? 'font-semibold text-ink' : 'text-muted'}">
									{num(value(r, col.key), col.key === 'rs' ? 2 : col.key === 'maxNp' ? 0 : 1)}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Phones: compact rows, tap for details -->
	<ul class="card overflow-hidden p-2 md:hidden">
		<li class="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-x-2 px-3 pt-2 pb-1 text-xs font-medium text-muted">
			<span>#</span><span>Team</span><span class="w-12 text-right">OPR</span>
		</li>
		{#each sorted as r (r.team)}
			{@const open = expanded === r.team}
			{@const mine = r.team === highlight}
			<li class="rounded-2xl {mine ? 'bg-accent-soft' : open ? 'bg-surface-2' : ''}">
				<button
					type="button"
					aria-expanded={open}
					onclick={() => (expanded = open ? null : r.team)}
					class="grid min-h-16 w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-2 px-3 py-2.5 text-left"
				>
					<span class="font-display text-xl {mine ? 'text-accent' : ''}">{r.stats?.rank ?? '–'}</span>
					<span class="min-w-0">
						<span class="line-clamp-2 wrap-anywhere"><span class="font-semibold">{r.team}</span> {r.name}</span>
						<span class="block text-xs text-muted">{r.stats ? `${record(r.stats)} · RS ${num(r.stats.rs, 2)}` : 'No matches yet'}</span>
					</span>
					<span class="w-12 shrink-0 text-right">
						<span class="block text-sm font-semibold">{num(r.stats?.oprNp)}</span>
						<span class="mt-1 ml-auto block h-1 w-12 overflow-hidden rounded-full bg-line">
							<span class="block h-full rounded-full bg-accent" style:width="{Math.max(0, ((r.stats?.oprNp ?? 0) / maxOpr) * 100)}%"></span>
						</span>
					</span>
				</button>
				{#if open}
					{#if r.stats}
						<dl class="grid grid-cols-3 gap-2 px-3 pb-2 text-sm">
							{#each season.components as c (c.key)}
								<div class="rounded-2xl bg-surface p-3"><dt class="text-xs text-muted">{c.label}</dt><dd class="mt-0.5 font-display text-lg">{num(r.stats.opr[c.key])}</dd></div>
							{/each}
							<div class="rounded-2xl bg-surface p-3"><dt class="text-xs text-muted">Avg</dt><dd class="mt-0.5 font-display text-lg">{num(r.stats.avgNp)}</dd></div>
							<div class="rounded-2xl bg-surface p-3"><dt class="text-xs text-muted">High</dt><dd class="mt-0.5 font-display text-lg">{num(r.stats.maxNp, 0)}</dd></div>
							<div class="rounded-2xl bg-surface p-3"><dt class="text-xs text-muted">Played</dt><dd class="mt-0.5 font-display text-lg">{r.stats.played}</dd></div>
							{#each season.rps as rp (rp.key)}
								<div class="rounded-2xl bg-surface p-3"><dt class="text-xs break-words text-muted">{rp.label} RP</dt><dd class="mt-0.5 font-display text-lg">{pct(r.stats.rpRate[rp.key])}</dd></div>
							{/each}
						</dl>
					{/if}
					<div class="flex items-center justify-between gap-3 px-3 pb-3">
						<p class="min-w-0 px-1 text-xs break-words text-muted">{r.location}</p>
						<a href="/teams/{r.team}" class="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm font-medium text-accent">
							Team page <Icon name="arrow" class="size-3.5" />
						</a>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
