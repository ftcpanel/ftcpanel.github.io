<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import { TeamSearchQuery } from '#lib/api/queries.ts';
	import { place } from '#lib/format.ts';
	import type { MyTeam } from '#lib/stores/myTeam.svelte.ts';
	import Icon from './Icon.svelte';

	let { onpick, autofocus = false }: { onpick: (team: MyTeam) => void; autofocus?: boolean } =
		$props();

	let text = $state('');
	let debounced = $state('');
	$effect(() => {
		const value = text.trim();
		const t = setTimeout(() => (debounced = value), 200);
		return () => clearTimeout(t);
	});

	const results = createQuery(() => ({
		queryKey: ['teamSearch', debounced],
		queryFn: ({ signal }) => query(TeamSearchQuery, { text: debounced }, signal),
		enabled: debounced.length > 0,
		staleTime: 10 * 60_000
	}));
</script>

<div class="text-ink">
	<label class="relative block">
		<span class="sr-only">Team number or name</span>
		<Icon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
		<!-- svelte-ignore a11y_autofocus -->
		<input
			bind:value={text}
			{autofocus}
			type="search"
			inputmode="search"
			autocomplete="off"
			placeholder="Team number or name"
			class="h-14 w-full rounded-full bg-surface pr-4 pl-12 text-base shadow-[var(--card-shadow)] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
		/>
	</label>

	{#if debounced}
		<ul class="card mt-2 overflow-hidden p-1.5">
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
							class="flex min-h-14 w-full items-center gap-4 rounded-2xl px-3 py-2 text-left transition hover:bg-surface-2"
							onclick={() => onpick({ number: team.number, name: team.name })}
						>
							<span class="w-16 shrink-0 text-sm font-semibold">{team.number}</span>
							<span class="min-w-0 flex-1">
								<span class="line-clamp-2 font-medium wrap-anywhere">{team.name}</span>
								<span class="block text-sm break-words text-muted">{place(team.location)}</span>
							</span>
							<Icon name="arrow" class="size-4 shrink-0 text-muted" />
						</button>
					</li>
				{/each}
			{/if}
		</ul>
	{/if}
</div>
