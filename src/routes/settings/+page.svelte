<script lang="ts">
	import TeamPicker from '#lib/components/TeamPicker.svelte';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';
	import { theme, type Theme } from '#lib/stores/theme.svelte.ts';

	const themes: { value: Theme; label: string; blurb: string }[] = [
		{ value: 'simple', label: 'Simple', blurb: 'Flat page, outlined cards. Fastest, easiest to read.' },
		{ value: 'glass', label: 'Glass', blurb: 'Colorful gradient with real liquid glass that bends what is under it.' }
	];

	let changingTeam = $state(false);
</script>

<svelte:head><title>Settings · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-3xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<h1 class="font-display text-4xl text-on-bg">Settings</h1>
	<p class="mt-1 text-on-bg/75">Saved on this device only.</p>

	<section class="card mt-8 p-5 sm:p-6" aria-labelledby="theme-h">
		<h2 id="theme-h" class="text-lg font-semibold tracking-tight">Theme</h2>
		<p class="text-sm text-muted">Dark mode follows your device in both themes.</p>
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
					<!-- Mini preview of the theme -->
					<span
						class="relative block h-24 overflow-hidden rounded-2xl"
						style:background={t.value === 'glass' ? 'var(--glass-page-bg)' : 'var(--page)'}
						style:box-shadow={t.value === 'simple' ? 'inset 0 0 0 1px var(--line)' : undefined}
						aria-hidden="true"
					>
						<span class="absolute top-3 left-3 h-2 w-16 rounded-full {t.value === 'glass' ? 'bg-white/80' : 'bg-ink/70'}"></span>
						<span class="absolute top-7 left-3 font-display text-2xl leading-none {t.value === 'glass' ? 'text-white' : 'text-ink'}">94.9</span>
						<span
							class="absolute top-6 right-3 h-6 w-14 rounded-full {t.value === 'glass'
								? 'bg-white/25 shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.45)]'
								: 'bg-surface shadow-[inset_0_0_0_1px_var(--line)]'}"
						></span>
						<span class="absolute right-3 bottom-3 left-3 h-7 rounded-xl bg-surface {t.value === 'simple' ? 'shadow-[inset_0_0_0_1px_var(--line)]' : ''}"></span>
					</span>
					<span class="mt-3 flex items-center justify-between px-1">
						<span class="font-semibold">{t.label}</span>
						{#if active}<span class="text-xs font-semibold text-accent">On</span>{/if}
					</span>
					<span class="mt-0.5 block px-1 text-sm text-muted">{t.blurb}</span>
				</button>
			{/each}
		</div>
		{#if theme.current === 'glass'}
			<p class="mt-4 text-sm text-muted">
				Want to tune the glass? <a href="/glass" class="font-medium text-accent hover:underline">Open the glass playground</a>.
			</p>
		{/if}
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

	<p class="mt-6 px-1 text-xs text-on-bg/70">
		Data from <a class="underline underline-offset-2" href="https://ftcscout.org" target="_blank" rel="noreferrer">FTC Scout</a>. FTCPanel is not affiliated with FIRST.
	</p>
</div>
