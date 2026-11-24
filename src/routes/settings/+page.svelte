<script lang="ts">
	import TeamPicker from '#lib/components/TeamPicker.svelte';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	let changingTeam = $state(false);
</script>

<svelte:head><title>Settings · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<h1 class="font-display text-4xl">Settings</h1>
	<p class="mt-1 text-muted">Saved on this device only.</p>

	<section class="card mt-8 p-5 sm:p-6" aria-labelledby="team-h">
		<h2 id="team-h" class="text-lg font-semibold tracking-tight">My team</h2>
		{#if myTeam.current && !changingTeam}
			<div class="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
				<div>
					<p class="font-display text-2xl leading-none">{myTeam.current.number}</p>
					<p class="mt-1 text-sm text-muted">{myTeam.current.name}</p>
				</div>
				<div class="flex gap-2">
					<button type="button" class="h-10 rounded-full bg-surface px-4 text-sm font-medium shadow-[inset_0_0_0_1px_var(--line)] hover:bg-line" onclick={() => (changingTeam = true)}>
						Change
					</button>
					<button type="button" class="h-10 rounded-full px-4 text-sm font-medium text-muted hover:text-ink" onclick={() => myTeam.set(null)}>
						Remove
					</button>
				</div>
			</div>
		{:else}
			<p class="mt-1 mb-3 text-sm text-muted">Pick your team to get its live panel on the My Team tab.</p>
			<TeamPicker
				autofocus={changingTeam}
				onpick={(picked) => {
					myTeam.set(picked);
					changingTeam = false;
				}}
			/>
			{#if changingTeam}
				<button type="button" class="mt-2 h-10 text-sm text-muted hover:text-ink" onclick={() => (changingTeam = false)}>Cancel</button>
			{/if}
		{/if}
	</section>

	<p class="mt-6 px-1 text-xs text-muted">
		Data from <a class="underline underline-offset-2" href="https://ftcscout.org" target="_blank" rel="noreferrer">FTC Scout</a>. FTCPanel is not affiliated with FIRST.
	</p>
</div>
