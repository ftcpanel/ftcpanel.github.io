<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import type { EventSummaryFragment } from '#lib/api/gql/graphql.ts';
	import { EventsWindowQuery } from '#lib/api/queries.ts';
	import { isoDay } from '#lib/format.ts';
	import { CURRENT_SEASON } from '#lib/seasons/index.ts';
	import EventCard from './EventCard.svelte';
	import Segmented from './Segmented.svelte';

	/** `compact`: only the live list (home sidebar). */
	let { compact = false }: { compact?: boolean } = $props();

	const start = isoDay(-14);
	const end = isoDay(28);
	const events = createQuery(() => ({
		queryKey: ['eventsWindow', CURRENT_SEASON, start, end],
		queryFn: ({ signal }) => query(EventsWindowQuery, { season: CURRENT_SEASON, start, end }, signal),
		refetchInterval: 5 * 60_000
	}));

	type Bucket = 'live' | 'upcoming' | 'recent';
	const buckets = $derived.by(() => {
		const all: EventSummaryFragment[] = events.data?.eventsSearch ?? [];
		return {
			live: all.filter((e) => e.ongoing).sort((a, b) => a.name.localeCompare(b.name)),
			upcoming: all
				.filter((e) => !e.started)
				.sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name)),
			recent: all
				.filter((e) => e.finished)
				.sort((a, b) => b.end.localeCompare(a.end) || a.name.localeCompare(b.name))
		} satisfies Record<Bucket, EventSummaryFragment[]>;
	});
	const sections: { key: Bucket; label: string; empty: string }[] = [
		{ key: 'live', label: 'Live now', empty: 'No events in progress right now.' },
		{ key: 'upcoming', label: 'Upcoming', empty: 'No events in the next four weeks.' },
		{ key: 'recent', label: 'Recent', empty: 'No events in the last two weeks.' }
	];
	let tab = $state<Bucket>('live');
</script>

{#if events.isPending}
	<div class="space-y-2.5">
		{#each { length: 4 } as _, i (i)}
			<div class="h-20 animate-pulse rounded-3xl bg-surface/70"></div>
		{/each}
	</div>
{:else if events.isError}
	<p class="card p-5 text-sm text-red-al">Couldn't load events: {events.error.message}</p>
{:else if compact}
	<section>
		<h2 class="mb-3 flex items-baseline gap-2 text-lg font-semibold tracking-tight text-white">
			Live now <span class="text-sm font-normal text-white/70">{buckets.live.length}</span>
		</h2>
		<div class="space-y-2.5">
			{#each buckets.live as event (event.code)}
				<EventCard {event} />
			{:else}
				<p class="text-sm text-white/80">{sections[0].empty}</p>
			{/each}
		</div>
	</section>
{:else}
	<!-- Phone/tablet: segmented tabs. Desktop: all three columns side by side. -->
	<Segmented
		bind:value={tab}
		class="mb-4 xl:hidden"
		options={sections.map((s) => ({ value: s.key, label: s.label, badge: buckets[s.key].length }))}
	/>
	<div class="grid gap-8 xl:grid-cols-3">
		{#each sections as s (s.key)}
			<section class={tab === s.key ? '' : 'hidden xl:block'}>
				<!-- Desktop columns start on the page gradient. -->
				<h2 class="mb-3 hidden items-baseline gap-2 text-lg font-semibold tracking-tight text-white xl:flex">
					{s.label} <span class="text-sm font-normal text-white/70">{buckets[s.key].length}</span>
				</h2>
				<div class="space-y-2.5">
					{#each buckets[s.key] as event (event.code)}
						<EventCard {event} />
					{:else}
						<p class="card p-5 text-sm text-muted">{s.empty}</p>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
