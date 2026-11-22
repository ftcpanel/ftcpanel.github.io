<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import { SeasonEventsQuery } from '#lib/api/queries.ts';
	import EventCard from '#lib/components/EventCard.svelte';
	import EventLists from '#lib/components/EventLists.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { searchEvents } from '#lib/search/events.ts';
	import { CURRENT_SEASON, seasonInfo } from '#lib/seasons/index.ts';

	let text = $state('');
	let debounced = $state('');
	$effect(() => {
		const value = text.trim();
		const t = setTimeout(() => (debounced = value), 250);
		return () => clearTimeout(t);
	});

	// The whole season's event list, loaded on the first search and filtered locally (name, code,
	// city, state/province, country). The 250 ms debounce only keeps typing smooth.
	const all = createQuery(() => ({
		queryKey: ['seasonEvents', CURRENT_SEASON],
		queryFn: ({ signal }) => query(SeasonEventsQuery, { season: CURRENT_SEASON }, signal),
		enabled: debounced.length > 0,
		staleTime: 30 * 60_000
	}));
	const results = $derived(all.data ? searchEvents(all.data.eventsSearch, debounced) : []);
	const SHOWN = 60;
	let showAll = $state(false);
	$effect(() => {
		void debounced;
		showAll = false;
	});

	let input: HTMLInputElement;
	function onkeydown(e: KeyboardEvent) {
		if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
			e.preventDefault();
			input.focus();
		}
	}
</script>

<svelte:head><title>Events · FTCPanel</title></svelte:head>
<svelte:window {onkeydown} />

<div class="mx-auto max-w-screen-2xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6 lg:px-10 lg:pt-10">
	<header class="relative mb-8 flex flex-col gap-5 text-on-bg sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-on-bg/75">
				{seasonInfo(CURRENT_SEASON).name} · {CURRENT_SEASON}–{(CURRENT_SEASON + 1) % 100}
			</p>
			<h1 class="mt-1 font-display text-5xl">Events</h1>
		</div>
		<label class="relative block sm:w-96">
			<span class="sr-only">Search events</span>
			<Icon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
			<input
				bind:this={input}
				bind:value={text}
				type="search"
				inputmode="search"
				autocomplete="off"
				placeholder="Search events, cities, countries"
				class="h-12 w-full rounded-full bg-surface pr-12 pl-11 text-base shadow-[var(--card-shadow)] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
			/>
			<kbd
				class="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 rounded-md bg-surface-2 px-1.5 text-xs text-muted lg:block"
				>/</kbd
			>
		</label>
	</header>

	{#if debounced}
		{#if all.isPending}
			<p class="text-sm text-on-bg/80">Searching…</p>
		{:else if all.isError}
			<p class="text-sm text-red-al">{all.error.message}</p>
		{:else}
			<p class="mb-3 text-sm text-on-bg/75">
				{results.length === 1 ? '1 event' : `${results.length.toLocaleString()} events`} matching “{debounced}”
			</p>
			<div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
				{#each showAll ? results : results.slice(0, SHOWN) as event (event.code)}
					<EventCard {event} />
				{:else}
					<p class="text-sm text-on-bg/80">No events match “{debounced}”. Try a name, city, state or country.</p>
				{/each}
			</div>
			{#if !showAll && results.length > SHOWN}
				<button type="button" class="mt-4 h-10 text-sm font-medium text-accent" onclick={() => (showAll = true)}>
					Show all {results.length.toLocaleString()}
				</button>
			{/if}
		{/if}
	{:else}
		<EventLists />
	{/if}
</div>
