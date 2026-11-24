<script lang="ts" module>
	import type { TeamEventStats } from '#lib/types.ts';

	export interface LeaderRow {
		/** Rank in this list (unique-team OPR rank); null when the team has no matches yet. */
		rank: number | null;
		team: number;
		name: string;
		location: string;
		stats: TeamEventStats | null;
		/** The event the OPR comes from (season lists). */
		event: { season: number; code: string; name: string } | null;
		/** Qualification rank at the event (event lists). */
		eventRank: number | null;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { num, record } from '#lib/format.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';

	let {
		rows,
		season,
		highlight = null,
		mode,
		head
	}: {
		rows: LeaderRow[];
		season: SeasonInfo;
		highlight?: number | null;
		/** `season`: best OPR across events (shows its event); `event`: one event (shows the event rank). */
		mode: 'season' | 'event';
		/** Card header: title and caption. */
		head: Snippet;
	} = $props();

	const maxOpr = $derived(Math.max(1, ...rows.map((r) => r.stats?.oprNp ?? 0).filter((v) => !Number.isNaN(v))));
	const barWidth = (v: number | undefined) => `${Math.max(0, ((v ?? 0) / maxOpr) * 100)}%`;
</script>

<section class="card p-2" aria-label="Team leaderboard">
	<div class="px-3 pt-3 pb-2 sm:px-4">
		{@render head()}
	</div>

	{#if rows.length === 0}
		<p class="px-4 py-10 text-center text-sm text-muted">No teams with results here yet.</p>
	{:else}
		<!-- md+: table with a sticky header -->
		<table class="hidden w-full text-sm md:table">
			<thead class="text-left text-xs text-muted">
				<tr class="[&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-surface [&>th]:py-2.5 [&>th]:font-medium">
					<th class="w-14 pl-5" title="Rank">#</th>
					<th class="px-2">Team</th>
					<th class="px-2 text-right" title="Offensive power rating (no penalties)">OPR</th>
					{#each season.components as c (c.key)}
						<th class="px-2 text-right" title="{c.label} OPR">
							<span class="xl:hidden">{c.short}</span><span class="hidden xl:inline">{c.label}</span>
						</th>
					{/each}
					<th class="hidden px-2 text-right lg:table-cell" title="Wins-losses-ties at that event">W-L-T</th>
					<th class="hidden px-2 text-right lg:table-cell" title="Average alliance score at that event (no penalties)">Avg</th>
					{#if mode === 'season'}
						<th class="hidden pr-5 pl-3 lg:table-cell">Best event</th>
					{:else}
						<th class="pr-5 pl-2 text-right" title="Qualification rank at the event">Event rank</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each rows as r (r.team)}
					{@const mine = r.team === highlight}
					<tr
						data-team={r.team}
						class="scroll-mt-16 transition {mine ? 'bg-accent-soft' : 'hover:bg-surface-2'} [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl"
					>
						<td class="py-3 pl-5">
							<span class="font-display text-xl {mine ? 'text-accent' : ''}">{r.rank ?? '–'}</span>
						</td>
						<td class="w-1/2 max-w-0 px-2 py-3 lg:w-[34%]">
							<a href="/teams/{r.team}" class="flex min-w-0 items-baseline gap-2 hover:text-accent hover:underline">
								<span class="font-semibold">{r.team}</span>
								<span class="truncate">{r.name}</span>
							</a>
							<span class="block truncate text-xs text-muted">{r.location}</span>
						</td>
						<td class="px-2 py-3">
							<span class="flex items-center justify-end gap-2.5">
								<span class="hidden h-1.5 w-14 overflow-hidden rounded-full bg-surface-2 xl:block" aria-hidden="true">
									<span class="block h-full rounded-full bg-accent" style:width={barWidth(r.stats?.oprNp)}></span>
								</span>
								<span class="w-12 text-right font-semibold">{num(r.stats?.oprNp)}</span>
							</span>
						</td>
						{#each season.components as c (c.key)}
							<td class="px-2 py-3 text-right text-muted">{num(r.stats?.opr[c.key])}</td>
						{/each}
						<td class="hidden px-2 py-3 text-right whitespace-nowrap text-muted lg:table-cell">{r.stats ? record(r.stats) : '–'}</td>
						<td class="hidden px-2 py-3 text-right text-muted lg:table-cell">{num(r.stats?.avgNp)}</td>
						{#if mode === 'season'}
							<td class="hidden max-w-0 py-3 pr-5 pl-3 lg:table-cell lg:w-[22%]">
								{#if r.event}
									<a
										href="/events/{r.event.season}/{r.event.code}"
										title={r.event.name}
										class="block truncate text-xs text-muted hover:text-accent hover:underline">{r.event.name}</a
									>
								{/if}
							</td>
						{:else}
							<td class="py-3 pr-5 pl-2 text-right text-muted">{r.eventRank ?? '–'}</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Phones: compact row cards -->
		<ul class="md:hidden">
			{#each rows as r (r.team)}
				{@const mine = r.team === highlight}
				<li data-team={r.team} class="scroll-mt-4">
					<a
						href="/teams/{r.team}"
						class="grid min-h-16 grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-2 rounded-2xl px-3 py-2.5 transition {mine
							? 'bg-accent-soft'
							: 'active:bg-surface-2'}"
					>
						<span class="font-display text-xl {mine ? 'text-accent' : ''}">{r.rank ?? '–'}</span>
						<span class="min-w-0">
							<span class="line-clamp-2 wrap-anywhere"><span class="font-semibold">{r.team}</span> {r.name}</span>
							<span class="block text-xs break-words text-muted">
								{[r.location, mode === 'event' && r.eventRank !== null ? `Rank ${r.eventRank}` : '', r.stats ? record(r.stats) : 'No matches']
									.filter(Boolean)
									.join(' · ')}
							</span>
							{#if r.stats}
								<span class="mt-0.5 block text-xs text-muted">
									{#each season.components as c, i (c.key)}{i ? ' · ' : ''}{c.short}&nbsp;<span class="text-ink">{num(r.stats.opr[c.key])}</span>{/each}
								</span>
							{/if}
							{#if mode === 'season' && r.event}
								<span class="line-clamp-2 text-[11px] text-muted wrap-anywhere">{r.event.name}</span>
							{/if}
						</span>
						<span class="shrink-0 text-right">
							<span class="block font-display text-2xl leading-7">{num(r.stats?.oprNp)}</span>
							<span class="block text-[11px] text-muted">OPR</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</section>
