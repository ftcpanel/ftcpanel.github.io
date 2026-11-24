<script lang="ts" module>
	import type { RegionOption } from '#lib/api/gql/graphql.ts';

	/** The list the page is showing, so the card can point out the team's rank in it. */
	export type LeaderScope =
		| { kind: 'global' }
		| { kind: 'nation' | 'region'; code: RegionOption }
		| {
				kind: 'event';
				name: string;
				/** The team's place at the event: OPR rank among teams with results, and its event rank. */
				entry: { rank: number | null; count: number; eventRank: number | null } | null;
		  };
</script>

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import { TeamScopeRanksQuery } from '#lib/api/queries.ts';
	import Icon from '#lib/components/Icon.svelte';
	import { teamQueryOptions } from '#lib/components/TeamOverview.svelte';
	import { num, place } from '#lib/format.ts';
	import { homeRegion, nationOf, regionName } from '#lib/regions.ts';
	import { CURRENT_SEASON, normalizeStats } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	let {
		number,
		scope,
		onshow = null,
		onclose
	}: {
		number: number;
		scope: LeaderScope;
		/** Scrolls to the team's row; set when the team is in the loaded list. */
		onshow?: (() => void) | null;
		onclose: () => void;
	} = $props();

	const team = createQuery(() => teamQueryOptions(number));
	const t = $derived(team.data?.teamByNumber);
	const qs = $derived(t?.quickStats ?? null);

	const region = $derived(t ? homeRegion(t.events.map((e) => e.event)) : null);
	const nation = $derived(nationOf(region));

	// Same query shape and key as ScopeRanks on the team page.
	const home = createQuery(() => ({
		queryKey: ['scopeRanks', number, CURRENT_SEASON, region, nation],
		queryFn: ({ signal }) =>
			query(TeamScopeRanksQuery, { number, season: CURRENT_SEASON, region: region!, nation: nation ?? region! }, signal),
		enabled: region !== null
	}));

	/** The page's nation/region when it isn't one of the team's own. */
	const other = $derived(
		(scope.kind === 'nation' || scope.kind === 'region') && scope.code !== region && scope.code !== nation ? scope.code : null
	);
	const away = createQuery(() => ({
		queryKey: ['scopeRanks', number, CURRENT_SEASON, other, other],
		queryFn: ({ signal }) =>
			query(TeamScopeRanksQuery, { number, season: CURRENT_SEASON, region: other!, nation: other! }, signal),
		enabled: other !== null && qs !== null
	}));

	interface RankChip {
		key: string;
		label: string;
		value: { rank: number; count: number } | null;
		pending: boolean;
		current: boolean;
	}
	const fromStats = (q: { count: number; tot: { rank: number } } | null | undefined) =>
		q ? { rank: q.tot.rank, count: q.count } : null;

	const chips = $derived.by(() => {
		const out: RankChip[] = [];
		if (!qs) return out;
		const scoped = scope.kind === 'nation' || scope.kind === 'region' ? scope.code : null;
		out.push({ key: 'All', label: 'World', value: { rank: qs.tot.rank, count: qs.count }, pending: false, current: scope.kind === 'global' });
		if (nation)
			out.push({
				key: nation,
				label: regionName(nation),
				value: fromStats(home.data?.teamByNumber?.nation),
				pending: home.isPending,
				current: scoped === nation
			});
		if (region && region !== nation)
			out.push({
				key: region,
				label: regionName(region),
				value: fromStats(home.data?.teamByNumber?.region),
				pending: home.isPending,
				current: scoped === region
			});
		if (other)
			out.push({
				key: other,
				label: regionName(other),
				value: fromStats(away.data?.teamByNumber?.region),
				pending: away.isPending,
				current: true
			});
		return out;
	});

	const tiles = $derived(
		qs
			? [
					{ label: 'Season OPR', stat: qs.tot },
					{ label: 'Auto', stat: qs.auto },
					{ label: 'Teleop', stat: qs.dc },
					{ label: 'Endgame', stat: qs.eg }
				]
			: []
	);

	const results = $derived((t?.events ?? []).map((e) => normalizeStats(e.stats)).filter((s) => s !== null && s.played > 0));
	const totals = $derived(
		results.reduce((a, s) => ({ wins: a.wins + s!.wins, losses: a.losses + s!.losses, ties: a.ties + s!.ties }), {
			wins: 0,
			losses: 0,
			ties: 0
		})
	);

	const mine = $derived(myTeam.current?.number ?? null);
	const compareHref = $derived(mine !== null && mine !== number ? `/compare?teams=${mine},${number}` : `/compare?teams=${number}`);
</script>

<section class="card p-5 sm:p-6" aria-label="Team {number}">
	<div class="flex items-start gap-4">
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<p class="font-display text-4xl leading-none">{number}</p>
				{#if mine === number}
					<span class="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">Your team</span>
				{/if}
			</div>
			{#if t}
				<p class="mt-1.5 font-semibold wrap-anywhere">{t.name}</p>
				<p class="text-sm break-words text-muted">{place(t.location)}</p>
			{:else if team.isPending}
				<div class="mt-2 h-5 w-48 animate-pulse rounded-lg bg-line"></div>
			{/if}
		</div>
		<button
			type="button"
			class="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition hover:text-ink"
			aria-label="Close"
			onclick={onclose}
		>
			<Icon name="close" class="size-4" />
		</button>
	</div>

	{#if team.isError}
		<p class="mt-4 text-sm text-red-al">Couldn't load team: {team.error.message}</p>
	{:else if team.isSuccess && !t}
		<p class="mt-4 text-sm text-muted">Team {number} wasn't found on FTC Scout.</p>
	{:else if team.isPending}
		<div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
			{#each { length: 4 } as _, i (i)}<div class="h-24 animate-pulse rounded-3xl bg-surface-2"></div>{/each}
		</div>
	{:else if t}
		{#if qs}
			<div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
				{#each tiles as tile (tile.label)}
					<div class="rounded-3xl bg-surface-2 p-4">
						<p class="eyebrow text-muted">{tile.label}</p>
						<p class="mt-1 font-display text-3xl">{num(tile.stat.value)}</p>
						<p class="text-xs text-muted">#{tile.stat.rank.toLocaleString()} worldwide</p>
					</div>
				{/each}
			</div>

			<ul class="mt-4 flex flex-wrap gap-2" aria-label="Season OPR rank by area">
				{#each chips as c (c.key)}
					<li
						class="flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-sm {c.current
							? 'bg-accent-soft text-accent'
							: 'bg-surface-2'}"
					>
						<span class={c.current ? '' : 'text-muted'}>{c.label}</span>
						{#if c.value}
							<span class="font-semibold">#{c.value.rank.toLocaleString()}</span>
							<span class="text-xs opacity-70">/ {c.value.count.toLocaleString()}</span>
						{:else if c.pending}
							<span class="h-4 w-10 animate-pulse rounded bg-line"></span>
						{:else}
							<span class="text-xs text-muted">not ranked</span>
						{/if}
					</li>
				{/each}
				{#if scope.kind === 'event'}
					<li class="flex min-h-10 min-w-0 flex-wrap items-center gap-x-1.5 rounded-3xl bg-accent-soft px-3.5 py-1.5 text-sm text-accent">
						<span class="min-w-0 wrap-anywhere">{scope.name}</span>
						{#if scope.entry?.rank}
							<span class="shrink-0 font-semibold">#{scope.entry.rank}</span>
							<span class="shrink-0 text-xs opacity-70">/ {scope.entry.count} by OPR</span>
						{:else if scope.entry}
							<span class="shrink-0 text-xs">no results yet</span>
						{:else}
							<span class="shrink-0 text-xs">not at this event</span>
						{/if}
					</li>
				{/if}
			</ul>
		{:else}
			<p class="mt-4 text-sm text-muted">No matches played this season yet.</p>
		{/if}

		<div class="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<p class="text-sm text-muted">
				{#if results.length > 0}
					<span class="font-semibold text-ink">{totals.wins}-{totals.losses}-{totals.ties}</span> across {results.length}
					{results.length === 1 ? 'event' : 'events'}{#if t.events.length > results.length}&nbsp;· {t.events.length} registered{/if}
				{:else}
					{t.events.length === 1 ? '1 event' : `${t.events.length} events`} registered
				{/if}
			</p>
			<div class="flex flex-wrap gap-2 *:flex-1 *:justify-center *:whitespace-nowrap sm:*:flex-none">
				{#if onshow}
					<button
						type="button"
						class="flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-sm font-medium transition hover:bg-line"
						onclick={onshow}
					>
						Show in list <Icon name="chevron" class="size-4" />
					</button>
				{/if}
				<a href={compareHref} class="flex h-10 items-center gap-1.5 rounded-full bg-surface-2 px-4 text-sm font-medium transition hover:bg-line">
					<Icon name="swap" class="size-4" /> Compare
				</a>
				<a href="/teams/{number}" class="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-medium text-bg transition hover:opacity-90">
					Team page <Icon name="arrow" class="size-4" />
				</a>
			</div>
		</div>
	{/if}
</section>
