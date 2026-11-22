<script lang="ts" module>
	import { query } from '#lib/api/client.ts';
	import { MyTeamQuery } from '#lib/api/queries.ts';
	import { CURRENT_SEASON } from '#lib/seasons/index.ts';

	/** One team's current-season overview; shared so pages reading the same team hit one cache entry. */
	export const teamQueryOptions = (number: number) => ({
		queryKey: ['team', number, CURRENT_SEASON],
		queryFn: ({ signal }: { signal: AbortSignal }) => query(MyTeamQuery, { number, season: CURRENT_SEASON }, signal)
	});
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import EventCard from '#lib/components/EventCard.svelte';
	import HeroChart from '#lib/components/HeroChart.svelte';
	import RankChart from '#lib/components/RankChart.svelte';
	import ScopeRanks from '#lib/components/ScopeRanks.svelte';
	import TeamEventLive from '#lib/components/TeamEventLive.svelte';
	import { num, place, record } from '#lib/format.ts';
	import { glass } from '#lib/glass/layer.ts';
	import { acquireLiveEvent, type LiveEvent } from '#lib/live/liveEvent.svelte.ts';
	import { rankHistory } from '#lib/model/rankHistory.ts';
	import { normalizeStats, seasonInfo } from '#lib/seasons/index.ts';

	let {
		number,
		name = null,
		children
	}: {
		number: number;
		/** Shown until the team loads (e.g. the saved name). */
		name?: string | null;
		/** Extra content after the team's events. */
		children?: Snippet;
	} = $props();

	const team = createQuery(() => teamQueryOptions(number));

	const t = $derived(team.data?.teamByNumber);
	const events = $derived(
		(t?.events ?? [])
			.map((e) => ({ event: e.event, stats: normalizeStats(e.stats) }))
			.sort((a, b) => a.event.start.localeCompare(b.event.start))
	);
	const played = $derived(events.filter((e) => e.stats && e.stats.played > 0));
	const liveEvent = $derived(events.find((e) => e.event.ongoing));
	/** Earlier events this season with results, to compare the live event against. */
	const previous = $derived(
		liveEvent
			? played
					.filter((e) => e.event.code !== liveEvent.event.code && e.event.start < liveEvent.event.start)
					.map((e) => ({ name: e.event.name, start: e.event.start, stats: e.stats! }))
			: []
	);
	const qs = $derived(t?.quickStats);
	const tiles = $derived(
		qs
			? [
					{ label: 'Total OPR', stat: qs.tot },
					{ label: 'Auto', stat: qs.auto },
					{ label: 'Teleop', stat: qs.dc },
					{ label: 'Endgame', stat: qs.eg }
				]
			: []
	);
	const topPct = $derived(qs ? (qs.tot.rank / qs.count) * 100 : null);
	const season = seasonInfo(CURRENT_SEASON);

	const shortDate = (d: string) =>
		new Date(`${d}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

	// Rank progression: the event being played now, else the latest one with results.
	const focus = $derived(liveEvent ?? played.at(-1) ?? null);
	const focusCode = $derived(focus?.event.code ?? null);
	let focusFeed = $state<LiveEvent | null>(null);
	$effect(() => {
		if (!focusCode) return;
		const { feed, release } = acquireLiveEvent(CURRENT_SEASON, focusCode);
		focusFeed = feed;
		return () => {
			focusFeed = null;
			release();
		};
	});
	const eventRanks = $derived(focusFeed ? rankHistory(number, focusFeed.matches, focusFeed.rankings, season) : []);
	const seasonRanks = $derived(
		played.map((e) => ({ name: e.event.name, label: shortDate(e.event.start), rank: e.stats!.rank, of: null }))
	);
</script>

{#if team.isSuccess && !t}
	<p class="card mt-8 p-6 text-sm">
		Team <strong>{number}</strong> wasn't found on FTC Scout.
		<a href="/events" class="text-accent underline">Browse events</a>
	</p>
{:else}
	<!-- Headline number + chart on the gradient -->
	<section class="relative mt-8 text-on-bg" aria-label="Team {number}">
		<p class="text-on-bg/80">
			{t?.name ?? name ?? ''}{#if t}&nbsp;· {place(t.location)}{/if}
		</p>
		<div class="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2">
			<p class="font-display text-7xl leading-none sm:text-8xl">{number}</p>
			{#if topPct !== null}
				<span {@attach glass()} class="glass mb-2 rounded-full px-3 py-1 text-sm font-medium">
					Top {topPct < 10 ? topPct.toFixed(1) : Math.round(topPct)}% worldwide
				</span>
			{/if}
		</div>
		{#if played.length >= 2}
			<div class="mt-6">
				<p class="mb-1 text-sm text-on-bg/80">OPR by event</p>
				<HeroChart
					values={played.map((e) => e.stats!.oprNp)}
					labels={played.map((e) => shortDate(e.event.start))}
					note="{num(played.at(-1)!.stats!.oprNp)} OPR"
					label="OPR at each event this season"
				/>
			</div>
		{/if}
	</section>

	<div class="mt-8 space-y-4">
		{#if team.isError}
			<p class="card p-5 text-sm text-red-al">Couldn't load team: {team.error.message}</p>
		{/if}

		<!-- Season OPR boxes -->
		<section class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4" aria-label="Season OPR">
			{#if team.isPending}
				{#each { length: 4 } as _, i (i)}
					<div class="card h-32 animate-pulse"></div>
				{/each}
			{:else}
				{#each tiles as tile (tile.label)}
					<div class="card p-5">
						<p class="eyebrow text-muted">{tile.label}</p>
						<p class="mt-2 font-display text-4xl">{num(tile.stat.value)}</p>
						<p class="mt-1 text-sm text-muted">#{tile.stat.rank.toLocaleString()} of {qs!.count.toLocaleString()}</p>
					</div>
				{:else}
					<p class="card col-span-full p-5 text-sm text-muted">No matches played this season yet.</p>
				{/each}
			{/if}
		</section>

		{#if liveEvent}
			<TeamEventLive team={number} event={liveEvent.event} feed={focusFeed} {previous} />
		{/if}

		{#if !team.isPending && t}
			<ScopeRanks
				team={t.number}
				season={CURRENT_SEASON}
				country={t.location.country}
				events={events.map((e) => e.event)}
				global={qs ? { rank: qs.tot.rank, count: qs.count } : null}
			/>
		{/if}

		{#if !team.isPending && (played.length > 0 || liveEvent)}
			<RankChart event={eventRanks} eventName={focus?.event.name ?? null} season={seasonRanks} />
		{/if}

		<section class="pt-4">
			<h2 class="mb-3 text-lg font-semibold tracking-tight text-on-bg">This season's events</h2>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				{#each events as e (e.event.code)}
					<EventCard event={e.event}>
						{#if e.stats}
							<p class="mt-1 text-sm">
								Rank <span class="font-semibold">{e.stats.rank}</span> · {record(e.stats)} · OPR {num(e.stats.oprNp)}
							</p>
						{/if}
					</EventCard>
				{:else}
					{#if !team.isPending}
						<p class="text-sm text-on-bg/80">Not registered for any events yet.</p>
					{/if}
				{/each}
			</div>
		</section>

		{@render children?.()}
	</div>
{/if}
