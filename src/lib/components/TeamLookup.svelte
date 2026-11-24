<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import { TeamSearchQuery } from '#lib/api/queries.ts';
	import { place } from '#lib/format.ts';
	import Icon from './Icon.svelte';

	let { onpick, class: cls = '' }: { onpick: (team: number) => void; class?: string } = $props();

	let text = $state('');
	let debounced = $state('');
	let open = $state(false);
	let root: HTMLDivElement;
	$effect(() => {
		const value = text.trim();
		const t = setTimeout(() => (debounced = value), 200);
		return () => clearTimeout(t);
	});

	// Same cache entry as TeamPicker.
	const results = createQuery(() => ({
		queryKey: ['teamSearch', debounced],
		queryFn: ({ signal }) => query(TeamSearchQuery, { text: debounced }, signal),
		enabled: debounced.length > 0,
		staleTime: 10 * 60_000
	}));

	function pick(team: number) {
		onpick(team);
		text = '';
		debounced = '';
		open = false;
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
		else if (e.key === 'Enter') {
			// Enter picks the first match, or an exact team number.
			const first = results.data?.teamsSearch[0];
			if (first && debounced === text.trim()) pick(first.number);
			else if (/^\d{1,6}$/.test(text.trim())) pick(Number(text.trim()));
		} else open = true;
	}
</script>

<svelte:window onpointerdown={(e) => root && !root.contains(e.target as Node) && (open = false)} />

<div bind:this={root} class="relative text-ink {cls}">
	<label class="relative block">
		<span class="sr-only">Look up a team</span>
		<Icon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
		<input
			bind:value={text}
			{onkeydown}
			onfocus={() => (open = true)}
			oninput={() => (open = true)}
			type="search"
			inputmode="search"
			autocomplete="off"
			placeholder="Look up a team"
			class="h-12 w-full rounded-full bg-surface pr-4 pl-11 text-base shadow-[var(--card-shadow)] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
		/>
	</label>

	{#if open && debounced}
		<ul class="card absolute inset-x-0 top-full z-30 mt-2 overflow-hidden p-1.5">
			{#if results.isPending}
				<li class="px-4 py-3 text-sm text-muted">Searching…</li>
			{:else if results.isError}
				<li class="px-4 py-3 text-sm text-red-al">{results.error.message}</li>
			{:else if results.data?.teamsSearch.length === 0}
				<li class="px-4 py-3 text-sm text-muted">No teams found</li>
			{:else}
				{#each results.data?.teamsSearch ?? [] as team (team.number)}
					<li>
						<button
							type="button"
							class="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-surface-2"
							onclick={() => pick(team.number)}
						>
							<span class="w-14 shrink-0 text-sm font-semibold">{team.number}</span>
							<span class="min-w-0 flex-1">
								<span class="line-clamp-2 font-medium wrap-anywhere">{team.name}</span>
								<span class="block text-xs break-words text-muted">{place(team.location)}</span>
							</span>
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
