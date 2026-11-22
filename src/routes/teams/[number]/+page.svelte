<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import TeamOverview, { teamQueryOptions } from '#lib/components/TeamOverview.svelte';
	import { glass } from '#lib/glass/layer.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	const raw = $derived(page.params.number ?? '');
	const number = $derived(/^\d{1,6}$/.test(raw) && Number(raw) > 0 ? Number(raw) : null);

	// Same cache entry TeamOverview reads; used for the title and "Set as my team".
	const team = createQuery(() => ({ ...teamQueryOptions(number ?? 0), enabled: number !== null }));
	const t = $derived(team.data?.teamByNumber);
	const isMine = $derived(number !== null && myTeam.current?.number === number);

	// Back returns to the previous in-app page; opened directly (shared link), it goes home.
	let canGoBack = $state(false);
	afterNavigate(({ from }) => {
		if (from) canGoBack = true;
	});
	function back(e: MouseEvent) {
		if (!canGoBack) return;
		e.preventDefault();
		history.back();
	}
</script>

<svelte:head><title>{number ?? raw}{t ? ` ${t.name}` : ''} · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<!-- Header on the gradient -->
	<header class="flex items-center justify-between gap-3 text-white">
		<a {@attach glass()} href="/" onclick={back} class="glass grid size-11 shrink-0 place-items-center rounded-full" aria-label="Back">
			<Icon name="back" class="size-5" />
		</a>
		{#if t && !isMine}
			<button
				type="button"
				{@attach glass()}
				class="glass flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium"
				onclick={() => myTeam.set({ number: t.number, name: t.name })}
			>
				Set as my team
			</button>
		{:else if isMine}
			<span {@attach glass()} class="glass flex h-11 items-center rounded-full px-4 text-sm font-medium">Your team</span>
		{/if}
	</header>

	{#if number === null}
		<p class="card mt-8 p-6 text-sm">
			Team <strong>{raw}</strong> wasn't found on FTC Scout.
			<a href="/events" class="text-accent underline">Browse events</a>
		</p>
	{:else}
		{#key number}
			<TeamOverview {number} />
		{/key}
	{/if}
</div>
