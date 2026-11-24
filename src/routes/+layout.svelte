<script lang="ts">
	import './layout.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import Icon, { type IconName } from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';
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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="relative min-h-dvh overflow-x-clip">
		<div class="relative min-h-dvh lg:pl-[17rem]">
			<main class="relative isolate min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
				{@render children()}
			</main>
		</div>

		<!-- Desktop: persistent rail -->
		<aside
			class="squircle fixed top-4 bottom-4 left-4 z-20 hidden w-64 rounded-[2rem] bg-surface shadow-[inset_0_0_0_1px_var(--line)] lg:block [@supports(corner-shape:squircle)]:rounded-[3rem]"
		>
			<div class="flex h-full flex-col gap-6 px-5 pt-7 pb-9">
				<a href="/" class="flex items-center gap-2.5 px-2">
					<Logo class="size-9" />
					<span class="text-lg font-semibold tracking-tight">FTC<span class="text-muted">Panel</span></span>
				</a>
				<div class="mx-2 h-px bg-line"></div>
				<nav class="flex flex-col gap-1" aria-label="Main">
					{#each nav as item (item.href)}
						{@const active = item.match(path)}
						<a
							href={item.href}
							aria-current={active ? 'page' : undefined}
							class="flex h-11 items-center gap-3 rounded-full px-4 text-sm font-medium transition {active
								? 'bg-accent-soft text-accent'
								: 'text-ink/85 hover:bg-surface-2 hover:text-ink'}"
						>
							<Icon name={item.icon} class="size-[18px]" />
							{item.label}
						</a>
					{/each}
				</nav>
				<div class="mt-auto space-y-4">
					{#if myTeam.current}
						<a href="/" class="card block p-4 transition hover:-translate-y-0.5">
							<p class="eyebrow text-muted">My team</p>
							<p class="mt-0.5 font-display text-2xl">{myTeam.current.number}</p>
							<p class="truncate text-sm text-muted">{myTeam.current.name}</p>
						</a>
					{/if}
					<p class="px-2 text-xs text-muted">
						Data from <a class="underline underline-offset-2" href="https://ftcscout.org" target="_blank" rel="noreferrer">FTC Scout</a>
					</p>
				</div>
			</div>
		</aside>

		<!-- Phones / tablets: floating tab pill within thumb reach. -->
		<nav
			aria-label="Main"
			class="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto flex w-max gap-1 rounded-full bg-surface p-1.5 shadow-[inset_0_0_0_1px_var(--line),0_10px_30px_-12px_rgb(0_0_0/0.25)] lg:hidden"
		>
			{#each nav as item (item.href)}
				{@const active = item.match(path)}
				<!-- Icon over label: four tabs fit a 360 px phone. -->
				<a
					href={item.href}
					aria-current={active ? 'page' : undefined}
					class="flex h-14 w-[4.75rem] flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition {active
						? 'bg-ink text-bg'
						: 'text-muted hover:text-ink'}"
				>
					<Icon name={item.icon} class="size-5" />
					{item.label}
				</a>
			{/each}
		</nav>
	</div>
</QueryClientProvider>
