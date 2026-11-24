<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import { SeasonEventsQuery } from '#lib/api/queries.ts';
	import { dateRange, place } from '#lib/format.ts';
	import { searchEvents } from '#lib/search/events.ts';
	import { CURRENT_SEASON } from '#lib/seasons/index.ts';
	import Icon from './Icon.svelte';

	let { onpick, class: cls = '' }: { onpick: (code: string) => void; class?: string } = $props();

	let text = $state('');
	let debounced = $state('');
	let open = $state(false);
	let root: HTMLDivElement;
	$effect(() => {
		const value = text.trim();
		const t = setTimeout(() => (debounced = value), 200);
		return () => clearTimeout(t);
	});

	// Same cache entry as the Events page search.
	const all = createQuery(() => ({
		queryKey: ['seasonEvents', CURRENT_SEASON],
		queryFn: ({ signal }) => query(SeasonEventsQuery, { season: CURRENT_SEASON }, signal),
		enabled: debounced.length > 0,
		staleTime: 30 * 60_000
	}));
	const results = $derived(all.data ? searchEvents(all.data.eventsSearch, debounced).slice(0, 6) : []);

	function pick(code: string) {
		onpick(code);
		text = '';
		debounced = '';
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
		else if (e.key === 'Enter' && results[0] && debounced === text.trim()) pick(results[0].code);
		else open = true;
	}
</script>

<svelte:window onpointerdown={(e) => root && !root.contains(e.target as Node) && (open = false)} />

<div bind:this={root} class="relative text-ink {cls}">
	<label class="relative block">
		<span class="sr-only">Find an event</span>
		<Icon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
		<input
			bind:value={text}
			{onkeydown}
			onfocus={() => (open = true)}
			oninput={() => (open = true)}
			type="search"
			inputmode="search"
			autocomplete="off"
			placeholder="Find an event: name, code, city"
			class="h-12 w-full rounded-full bg-surface pr-4 pl-11 text-base shadow-[var(--card-shadow)] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
		/>
	</label>

	{#if open && debounced}
		<ul class="card absolute inset-x-0 top-full z-30 mt-2 overflow-hidden p-1.5">
			{#if all.isPending}
				<li class="px-4 py-3 text-sm text-muted">Searching…</li>
			{:else if all.isError}
				<li class="px-4 py-3 text-sm text-red-al">{all.error.message}</li>
			{:else}
				{#each results as event (event.code)}
					<li>
						<button
							type="button"
							class="flex min-h-12 w-full flex-col justify-center rounded-2xl px-3 py-2 text-left transition hover:bg-surface-2"
							onclick={() => pick(event.code)}
						>
							<span class="line-clamp-2 w-full font-medium wrap-anywhere">{event.name}</span>
							<span class="block w-full text-xs break-words text-muted">
								{event.code} · {dateRange(event.start, event.end)} · {place(event.location)}
							</span>
						</button>
					</li>
				{:else}
					<li class="px-4 py-3 text-sm text-muted">No events match “{debounced}”</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
