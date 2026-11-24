<script lang="ts">
	import './layout.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { glass, mountGlass, RAIL_GLASS } from '#lib/glass/layer.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';
	import { theme } from '#lib/stores/theme.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: true } }
	});

	const nav: { href: string; label: string; icon: IconName; match: (path: string) => boolean }[] = [
		{ href: '/', label: 'My Team', icon: 'team', match: (p) => p === '/' },
		{ href: '/events', label: 'Events', icon: 'calendar', match: (p) => p.startsWith('/events') },
		{ href: '/teams', label: 'Teams', icon: 'podium', match: (p) => p.startsWith('/teams') || p.startsWith('/compare') },
		{ href: '/settings', label: 'Settings', icon: 'settings', match: (p) => p.startsWith('/settings') }
	];
	const path = $derived(page.url.pathname);
	const glassy = $derived(theme.current === 'glass');

	let glassRoot: HTMLDivElement;
	let content: HTMLDivElement;
	$effect(() => mountGlass(glassRoot, content));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<!--
		Liquid-glass root (src/lib/glass/layer.ts). Its direct children are what the glass sees and
		the glass itself: gradient → page content → glass (rail, tab bar, mirrors of in-page glass).
	-->
	<div bind:this={glassRoot} class="relative min-h-dvh overflow-x-clip">
		<div class="app-bg fixed inset-0 -z-10" aria-hidden="true"></div>

		<div bind:this={content} class="relative z-10 min-h-dvh lg:pl-[17rem]">
			<main class="relative isolate min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
				{@render children()}
			</main>
		</div>

		<!-- Desktop: persistent rail (liquid glass on the gradient in the glass theme) -->
		<aside
			{@attach glass({ direct: true, config: RAIL_GLASS })}
			class="glass-panel squircle fixed top-4 bottom-4 left-4 z-20 hidden w-64 rounded-[2rem] text-on-bg lg:block [@supports(corner-shape:squircle)]:rounded-[3rem]"
		>
			<!-- Generous inset: content inside the glass bevel gets refracted into streaks. -->
			<div class="flex h-full flex-col gap-6 px-5 pt-7 pb-9">
				<a href="/" class="flex items-center gap-2.5 px-2">
					<Logo class="size-9" />
					<span class="text-lg font-semibold tracking-tight">FTC<span class="text-on-bg/75">Panel</span></span>
				</a>
				<div class="mx-2 h-px bg-on-bg/15"></div>
				<nav class="flex flex-col gap-1" aria-label="Main">
					{#each nav as item (item.href)}
						{@const active = item.match(path)}
						<a
							href={item.href}
							aria-current={active ? 'page' : undefined}
							class="flex h-11 items-center gap-3 rounded-full px-4 text-sm font-medium transition {active
								? glassy
									? 'bg-white text-[#16161d] shadow-[0_8px_24px_-10px_rgb(0_0_0/0.35)]'
									: 'bg-accent-soft text-accent'
								: 'text-on-bg/85 hover:bg-on-bg/10 hover:text-on-bg'}"
						>
							<Icon name={item.icon} class="size-[18px]" />
							{item.label}
						</a>
					{/each}
				</nav>
				<div class="mt-auto space-y-4">
					{#if myTeam.current}
						<a href="/" class="card block p-4 text-ink transition hover:-translate-y-0.5">
							<p class="eyebrow text-muted">My team</p>
							<p class="mt-0.5 font-display text-2xl">{myTeam.current.number}</p>
							<p class="truncate text-sm text-muted">{myTeam.current.name}</p>
						</a>
					{/if}
					<p class="px-2 text-xs text-on-bg/75">
						Data from <a class="underline underline-offset-2" href="https://ftcscout.org" target="_blank" rel="noreferrer">FTC Scout</a>
					</p>
				</div>
			</div>
		</aside>

		<!-- Phones / tablets: floating tab pill within thumb reach (liquid glass in the glass theme). -->
		<nav
			aria-label="Main"
			{@attach glass({ direct: true, config: { blurAmount: 0.45, brightness: -0.3, saturation: 0.3 } })}
			class="glass fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-max gap-1 rounded-full p-1.5 lg:hidden {glassy
				? ''
				: 'shadow-[inset_0_0_0_1px_var(--line),0_10px_30px_-12px_rgb(0_0_0/0.25)]'}"
		>
			{#each nav as item (item.href)}
				{@const active = item.match(path)}
				<!-- Icon over label: four tabs fit a 360 px phone. -->
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					class="flex h-14 w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition {active
						? glassy
							? 'bg-white text-[#16161d] shadow-[0_6px_18px_-8px_rgb(0_0_0/0.4)]'
							: 'bg-ink text-bg'
						: glassy
							? 'text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.45)]'
							: 'text-muted hover:text-ink'}"
				>
					<Icon name={item.icon} class="size-5" />
					{item.label}
				</a>
			{/each}
		</nav>
	</div>
</QueryClientProvider>
