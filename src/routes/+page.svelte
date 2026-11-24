<script lang="ts">
	import EventLists from '#lib/components/EventLists.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import TeamOverview from '#lib/components/TeamOverview.svelte';
	import TeamPicker from '#lib/components/TeamPicker.svelte';
	import { CURRENT_SEASON, seasonInfo } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	let changing = $state(false);
	const season = seasonInfo(CURRENT_SEASON);
</script>

<svelte:head><title>{myTeam.current ? `${myTeam.current.number} · ` : ''}FTCPanel</title></svelte:head>

<div class="mx-auto max-w-6xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<!-- Page header -->
	<header class="flex items-center justify-between gap-3 text-ink">
		<div class="flex items-center gap-2.5 lg:hidden">
			<Logo class="size-9" />
			<span class="text-lg font-semibold tracking-tight">FTCPanel</span>
		</div>
		<h1 class="hidden font-display text-4xl lg:block">My Team</h1>
		{#if myTeam.current && !changing}
			<button
				type="button"
				class="chip flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium"
				onclick={() => (changing = true)}
			>
				<Icon name="swap" class="size-4" /> Change team
			</button>
		{/if}
	</header>

	{#if !myTeam.current || changing}
		<section class="relative mt-10 text-ink">
			<p class="text-ink/75">{season.name} · {CURRENT_SEASON}–{(CURRENT_SEASON + 1) % 100}</p>
			<h2 class="mt-2 max-w-xl font-display text-4xl leading-tight sm:text-6xl">Your team's live panel</h2>
			<p class="mt-3 mb-8 max-w-md text-ink/80">
				Live rankings, match predictions and matchups for your team. Saved on this device only.
			</p>
			<div class="max-w-lg">
				<TeamPicker
					autofocus={changing}
					onpick={(picked) => {
						myTeam.set(picked);
						changing = false;
					}}
				/>
			</div>
			{#if changing}
				<button type="button" class="mt-4 h-10 text-sm text-ink/80 underline-offset-4 hover:underline" onclick={() => (changing = false)}>
					Cancel
				</button>
			{/if}
		</section>
		<div class="mt-12"><EventLists compact /></div>
	{:else}
		<TeamOverview number={myTeam.current.number} name={myTeam.current.name}>
			<section class="pt-4">
				<EventLists compact />
			</section>
		</TeamOverview>
	{/if}
</div>
