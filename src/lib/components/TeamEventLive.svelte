<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import LiveDot from '#lib/components/LiveDot.svelte';
	import MyTeamAtEvent from '#lib/components/MyTeamAtEvent.svelte';
	import { dateRange, num } from '#lib/format.ts';
	import type { LiveEvent } from '#lib/live/liveEvent.svelte.ts';
	import { seasonInfo } from '#lib/seasons/index.ts';
	import type { TeamEventStats } from '#lib/types.ts';

	let {
		team,
		event,
		feed,
		previous
	}: {
		team: number;
		/** The event the team is competing at right now. */
		event: { season: number; code: string; name: string; start: string; end: string };
		/** Live feed for `event`; null until acquired. */
		feed: LiveEvent | null;
		/** The team's earlier events this season with results, oldest first. */
		previous: { name: string; start: string; stats: TeamEventStats }[];
	} = $props();

	const eventPath = $derived(`/events/${event.season}/${event.code}`);
	const loaded = $derived(feed?.info != null);
	const row = $derived(feed?.rankings.find((r) => r.team === team) ?? null);
	const now = $derived(row?.stats ?? null);
	const last = $derived(previous.at(-1) ?? null);

	type Metric = { label: string; get: (s: TeamEventStats) => number };
	const metrics = $derived<Metric[]>([
		{ label: 'Total OPR', get: (s) => s.oprNp },
		...seasonInfo(event.season).components.map((c) => ({ label: c.label, get: (s: TeamEventStats) => s.opr[c.key] ?? NaN })),
		{ label: 'Avg score', get: (s) => s.avgNp }
	]);
	/** Best value of a metric over all earlier events (only meaningful with 2+). */
	const bestBefore = (m: Metric) => {
		const vals = previous.map((p) => m.get(p.stats)).filter((v) => !Number.isNaN(v));
		return vals.length ? Math.max(...vals) : NaN;
	};
	const rows = $derived(
		metrics.map((m) => ({
			label: m.label,
			now: now ? m.get(now) : NaN,
			last: last ? m.get(last.stats) : NaN,
			best: previous.length >= 2 ? bestBefore(m) : NaN
		}))
	);
	const shortDate = (d: string) =>
		new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
</script>

{#snippet delta(value: number, before: number)}
	{@const d = value - before}
	{#if Number.isNaN(d)}
		<span class="block font-semibold text-muted">–</span>
	{:else}
		<span class="block font-semibold whitespace-nowrap {d >= 0.05 ? 'text-live' : d <= -0.05 ? 'text-warn' : 'text-muted'}">
			{d >= 0.05 ? '▲ +' : d <= -0.05 ? '▼ −' : '±'}{num(Math.abs(d))}
		</span>
	{/if}
	<span class="block text-xs whitespace-nowrap text-muted">from {num(before)}</span>
{/snippet}

<section class="space-y-3 sm:space-y-4" aria-label="At {event.name}">
	<a href={eventPath} class="card group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 sm:p-6">
		<div class="min-w-0 flex-1">
			<p class="eyebrow flex items-center gap-2 text-live"><LiveDot /> Competing now</p>
			<h2 class="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">At {event.name}</h2>
			<p class="text-sm text-muted">{dateRange(event.start, event.end)} · Event page</p>
		</div>
		<span class="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 transition group-hover:bg-ink group-hover:text-bg">
			<Icon name="arrow-up-right" class="size-5" />
		</span>
	</a>

	{#if !loaded || !feed}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
			{#each { length: 3 } as _, i (i)}
				<div class="card h-32 animate-pulse {i === 1 ? 'col-span-2 sm:col-span-1' : ''}"></div>
			{/each}
		</div>
	{:else}
		{#if row}
			<MyTeamAtEvent {team} matches={feed.matches} rankings={feed.rankings} predictions={feed.predictions} {eventPath} />
		{:else}
			<p class="card p-5 text-sm text-muted">{team} isn't on this event's team list.</p>
		{/if}

		<section class="card p-5 sm:p-6" aria-label="Compared to before">
			<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
				<h2 class="text-lg font-semibold tracking-tight">Compared to before</h2>
				{#if last}
					<p class="text-sm text-muted">
						vs {last.name} ({shortDate(last.start)}){#if previous.length >= 2}&nbsp;and best of {previous.length} earlier events{/if}
					</p>
				{:else}
					<p class="text-sm text-muted">First event of the season</p>
				{/if}
			</div>
			<table class="w-full text-sm tabular-nums">
				<thead>
					<tr class="eyebrow text-muted">
						<th class="pb-2 text-left font-medium"><span class="sr-only">Stat</span></th>
						<th class="pb-2 text-right font-medium">This event</th>
						{#if last}<th class="pb-2 pl-3 text-right font-medium">Last event</th>{/if}
						{#if previous.length >= 2}<th class="pb-2 pl-3 text-right font-medium">Season best</th>{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-line">
					{#each rows as r (r.label)}
						<tr>
							<th class="py-2.5 pr-2 text-left font-medium">{r.label}</th>
							<td class="py-2.5 text-right font-display text-xl">{num(r.now)}</td>
							{#if last}<td class="py-2.5 pl-3 text-right">{@render delta(r.now, r.last)}</td>{/if}
							{#if previous.length >= 2}<td class="py-2.5 pl-3 text-right">{@render delta(r.now, r.best)}</td>{/if}
						</tr>
					{/each}
				</tbody>
			</table>
			{#if now && Number.isNaN(now.oprNp)}
				<p class="mt-3 text-xs text-muted">OPR appears once FTC Scout publishes stats for this event.</p>
			{/if}
		</section>
	{/if}
</section>
