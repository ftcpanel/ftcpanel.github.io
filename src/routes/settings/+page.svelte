<script lang="ts">
	import TeamPicker from '#lib/components/TeamPicker.svelte';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';
	import { theme, type Theme } from '#lib/stores/theme.svelte.ts';

	const themes: { value: Theme; label: string; blurb: string }[] = [
		{ value: 'simple', label: 'Simple', blurb: 'Everything flat and outlined.' },
		{ value: 'gradient', label: 'Gradient', blurb: 'Page headers (big numbers, charts) on a colorful gradient panel.' }
	];

	let changingTeam = $state(false);
</script>

<svelte:head><title>Settings · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<h1 class="font-display text-4xl">Settings</h1>
	<p class="mt-1 text-muted">Saved on this device only.</p>

	<section class="card mt-8 p-5 sm:p-6" aria-labelledby="theme-h">
		<h2 id="theme-h" class="text-lg font-semibold tracking-tight">Theme</h2>
		<p class="text-sm text-muted">Dark mode follows your device in both.</p>
		<div class="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-labelledby="theme-h">
			{#each themes as t (t.value)}
				{@const active = theme.current === t.value}
				<button
					type="button"
					role="radio"
					aria-checked={active}
					onclick={() => theme.set(t.value)}
					class="rounded-3xl p-3 text-left transition {active ? 'bg-accent-soft ring-2 ring-accent' : 'bg-surface-2 hover:bg-line'}"
				>
					<!-- Mini page: a header block above two cards. -->
					<span class="block space-y-2 rounded-2xl bg-bg p-2.5 shadow-[inset_0_0_0_1px_var(--line)]" aria-hidden="true">
						<span
							class="block h-12 rounded-xl px-3 pt-2 {t.value === 'gradient' ? 'text-white' : 'bg-surface text-ink shadow-[inset_0_0_0_1px_var(--line)]'}"
							style:background={t.value === 'gradient' ? 'linear-gradient(150deg, #2a5db5, #5e5fcb 45%, #a274c4 78%, #eaa3b6)' : undefined}
						>
							<span class="font-display text-xl leading-none">94.9</span>
						</span>
						<span class="flex gap-2">
							<span class="h-6 flex-1 rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--line)]"></span>
							<span class="h-6 flex-1 rounded-lg bg-surface shadow-[inset_0_0_0_1px_var(--line)]"></span>
						</span>
					</span>
					<span class="mt-3 flex items-center justify-between px-1">
						<span class="font-semibold">{t.label}</span>
						{#if active}<span class="text-xs font-semibold text-accent">On</span>{/if}
					</span>
					<span class="mt-0.5 block px-1 text-sm text-muted">{t.blurb}</span>
				</button>
			{/each}
		</div>
	</section>
	<section class="card mt-4 p-5 sm:p-6" aria-labelledby="team-h">
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
