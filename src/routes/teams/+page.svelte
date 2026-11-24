<script lang="ts">
	import { tick } from 'svelte';
	import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { query } from '#lib/api/client.ts';
	import type { LeaderboardQuery as LeaderboardData, RegionOption } from '#lib/api/gql/graphql.ts';
	import { EventLiveQuery, LeaderboardQuery } from '#lib/api/queries.ts';
	import Icon from '#lib/components/Icon.svelte';
	import LeaderboardEventPicker from '#lib/components/LeaderboardEventPicker.svelte';
	import LeaderboardTable, { type LeaderRow } from '#lib/components/LeaderboardTable.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import { teamQueryOptions } from '#lib/components/TeamOverview.svelte';
	import TeamLookup from '#lib/components/TeamLookup.svelte';
	import TeamStatCard, { type LeaderScope } from '#lib/components/TeamStatCard.svelte';
	import { dateRange, place } from '#lib/format.ts';
	import { glass } from '#lib/glass/layer.ts';
	import { homeRegion, nationOf, nations, regionName, subregions, type RegionChoice } from '#lib/regions.ts';
	import { CURRENT_SEASON, normalizeStats, seasonInfo } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	const season = seasonInfo(CURRENT_SEASON);
	const NATIONS = nations();
	// FIRST regions: US/Canadian subregions, and countries that are a single region (e.g. Kazakhstan).
	const REGIONS = [...subregions(), ...NATIONS.filter((n) => n.code !== 'UnitedStates')].sort((a, b) => a.name.localeCompare(b.name));

	type Scope = 'global' | 'nation' | 'region' | 'event';
	const scopes: { value: Scope; label: string }[] = [
		{ value: 'global', label: 'Global' },
		{ value: 'nation', label: 'National' },
		{ value: 'region', label: 'Regional' },
		{ value: 'event', label: 'Event' }
	];

	// Initial state from the URL: ?scope=nation&region=KZ, ?scope=event&event=KZASQ1.
	const params = page.url.searchParams;
	const choice = (list: RegionChoice[], code: string | null) => list.find((c) => c.code === code)?.code ?? null;
	const initialScope = (scopes.find((s) => s.value === params.get('scope'))?.value ?? 'global') as Scope;
	let scope = $state<Scope>(initialScope);
	let nationPick = $state(initialScope === 'nation' ? choice(NATIONS, params.get('region')) : null);
	let regionPick = $state(initialScope === 'region' ? choice(REGIONS, params.get('region')) : null);
	let eventPick = $state(initialScope === 'event' ? params.get('event')?.trim().toUpperCase() || null : null);

	// Defaults come from my team: its nation, home region and latest event with results.
	const mine = createQuery(() => ({ ...teamQueryOptions(myTeam.current?.number ?? 0), enabled: myTeam.current !== null }));
	const mineEvents = $derived(mine.data?.teamByNumber?.events ?? []);
	const mineHome = $derived(homeRegion(mineEvents.map((e) => e.event)));
	/** Wait for my team before the first fetch, so the default list isn't loaded twice. */
	const resolving = $derived(myTeam.current !== null && mine.isPending);

	const nation = $derived<RegionOption>(nationPick ?? choice(NATIONS, nationOf(mineHome)) ?? 'UnitedStates');
	const region = $derived<RegionOption>(regionPick ?? choice(REGIONS, mineHome) ?? REGIONS[0].code);
	const latestEvent = $derived(
		mineEvents
			.filter((e) => (normalizeStats(e.stats)?.played ?? 0) > 0)
			.sort((a, b) => b.event.start.localeCompare(a.event.start))[0]?.event.code ?? null
	);
	const eventCode = $derived(eventPick ?? latestEvent);

	// Mirror the scope and picks into the URL (shareable); `reset: false` keeps scroll and focus.
	$effect(() => {
		if (resolving) return;
		const url = new URL(page.url.href);
		const p = url.searchParams;
		for (const key of ['scope', 'region', 'event']) p.delete(key);
		if (scope !== 'global') p.set('scope', scope);
		if (scope === 'nation') p.set('region', nation);
		if (scope === 'region') p.set('region', region);
		if (scope === 'event' && eventCode) p.set('event', eventCode);
		if (url.search !== page.url.search) goto(url, { replace: true, reset: false });
	});

	// Season lists: team-event records by OPR, deduped to each team's best event (filterSkipRank > 0).
	// FTC Scout returns at most 50 records per request, so one page is up to PAGE records.
	const PAGE = 100;
	type LeaderRecord = LeaderboardData['tepRecords']['data'][number];
	async function fetchBoard(regionArg: RegionOption | undefined, skip: number, signal: AbortSignal) {
		const records: LeaderRecord[] = [];
		let at = skip;
		let count = 0;
		do {
			const res = (
				await query(LeaderboardQuery, { season: CURRENT_SEASON, region: regionArg, skip: at, take: PAGE - records.length }, signal)
			).tepRecords;
			count = res.count;
			if (res.data.length === 0) break;
			records.push(...res.data);
			at += res.data.length;
		} while (records.length < PAGE && at < count);
		return { records, next: at < count ? at : null };
	}

	const boardRegion = $derived(scope === 'nation' ? nation : scope === 'region' ? region : undefined);
	const board = createInfiniteQuery(() => ({
		queryKey: ['leaderboard', CURRENT_SEASON, boardRegion ?? 'All'],
		queryFn: ({ pageParam, signal }) => fetchBoard(boardRegion, pageParam, signal),
		initialPageParam: 0,
		getNextPageParam: (last) => last.next ?? undefined,
		enabled: scope !== 'event' && !resolving,
		staleTime: 10 * 60_000
	}));
	const boardRows = $derived.by(() => {
		const seen = new Set<number>();
		const out: LeaderRow[] = [];
		for (const pg of board.data?.pages ?? []) {
			for (const r of pg.records) {
				const d = r.data;
				if (r.filterSkipRank <= 0 || seen.has(d.teamNumber)) continue;
				seen.add(d.teamNumber);
				out.push({
					rank: r.filterSkipRank,
					team: d.teamNumber,
					name: d.team.name,
					location: place(d.team.location),
					stats: normalizeStats(d.stats),
					event: { season: CURRENT_SEASON, code: d.eventCode, name: d.event.name },
					eventRank: null
				});
			}
		}
		return out;
	});

	// Event list: every team at the event by OPR (EventLive carries team names; EventTeamStats doesn't).
	const event = createQuery(() => ({
		queryKey: ['eventTeams', CURRENT_SEASON, eventCode],
		queryFn: ({ signal }) => query(EventLiveQuery, { season: CURRENT_SEASON, code: eventCode! }, signal),
		enabled: scope === 'event' && eventCode !== null
	}));
	const ev = $derived(event.data?.eventByCode ?? null);
	const eventRows = $derived.by(() => {
		const rows = (ev?.teams ?? []).map((t) => ({ t, stats: normalizeStats(t.stats) }));
		const ranked = rows.filter((r) => (r.stats?.played ?? 0) > 0).sort((a, b) => b.stats!.oprNp - a.stats!.oprNp);
		const rest = rows.filter((r) => !((r.stats?.played ?? 0) > 0)).sort((a, b) => a.t.teamNumber - b.t.teamNumber);
		return [...ranked, ...rest].map(
			({ t, stats }, i): LeaderRow => ({
				rank: i < ranked.length ? i + 1 : null,
				team: t.teamNumber,
				name: t.team.name,
				location: place(t.team.location),
				stats,
				event: null,
				eventRank: stats && stats.played > 0 ? stats.rank : null
			})
		);
	});
	const eventRanked = $derived(eventRows.filter((r) => r.rank !== null).length);

	const rows = $derived(scope === 'event' ? eventRows : boardRows);
	const scopeName = $derived(
		scope === 'global' ? 'World' : scope === 'nation' ? regionName(nation) : scope === 'region' ? regionName(region) : (ev?.name ?? eventCode ?? 'Event')
	);

	// Team lookup card.
	let lookup = $state<number | null>(null);
	let cardEl = $state<HTMLDivElement>();
	const lookupScope = $derived.by((): LeaderScope => {
		if (scope === 'global') return { kind: 'global' };
		if (scope === 'nation') return { kind: 'nation', code: nation };
		if (scope === 'region') return { kind: 'region', code: region };
		const row = eventRows.find((r) => r.team === lookup);
		return {
			kind: 'event',
			name: ev?.name ?? eventCode ?? 'This event',
			entry: row ? { rank: row.rank, count: eventRanked, eventRank: row.eventRank } : null
		};
	});

	async function show(team: number) {
		lookup = team;
		await tick();
		cardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	}

	function scrollToRow(team: number) {
		const el = [...document.querySelectorAll<HTMLElement>(`[data-team="${team}"]`)].find((e) => e.offsetParent !== null);
		el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	const selectClass =
		'h-12 w-full appearance-none truncate rounded-full bg-surface pr-11 pl-5 text-base text-ink shadow-[var(--card-shadow)] outline-none focus:ring-2 focus:ring-accent';
</script>

<svelte:head><title>Teams · FTCPanel</title></svelte:head>

{#snippet regionSelect(label: string, list: RegionChoice[], value: RegionOption, set: (code: RegionOption) => void)}
	<label class="relative block w-full lg:w-72">
		<span class="sr-only">{label}</span>
		<select class={selectClass} {value} onchange={(e) => set(e.currentTarget.value as RegionOption)}>
			{#each list as c (c.code)}
				<option value={c.code}>{c.name}</option>
			{/each}
		</select>
		<Icon name="chevron" class="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted" />
	</label>
{/snippet}

<div class="mx-auto max-w-screen-2xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<header class="relative z-30 mb-6 flex flex-col gap-5 text-on-bg xl:flex-row xl:items-end xl:justify-between">
		<div>
			<p class="text-on-bg/75">{season.name} · {CURRENT_SEASON}–{(CURRENT_SEASON + 1) % 100}</p>
			<h1 class="mt-1 font-display text-5xl">Teams</h1>
			<p class="mt-2 max-w-lg text-on-bg/75">Season OPR leaderboards, from the world down to one event.</p>
		</div>
		<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
			<TeamLookup class="sm:w-80" onpick={show} />
			<div class="flex gap-2.5">
				{#if myTeam.current}
					<button
						type="button"
						{@attach glass()}
						class="glass flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap sm:flex-none"
						onclick={() => show(myTeam.current!.number)}
					>
						<Icon name="pin" class="size-4" /> Find me
					</button>
				{/if}
				<a
					href="/compare"
					{@attach glass()}
					class="glass flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap sm:flex-none"
				>
					<Icon name="swap" class="size-4" /> Compare teams
				</a>
			</div>
		</div>
	</header>

	{#if lookup !== null}
		<div bind:this={cardEl} class="mb-6 scroll-mt-4">
			{#key lookup}
				<TeamStatCard
					number={lookup}
					scope={lookupScope}
					onshow={rows.some((r) => r.team === lookup) ? () => scrollToRow(lookup!) : null}
					onclose={() => (lookup = null)}
				/>
			{/key}
		</div>
	{/if}

	<div class="relative z-20 mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
		<Segmented bind:value={scope} options={scopes} class="w-full lg:w-[28rem]" />
		{#if scope === 'nation'}
			{@render regionSelect('Nation', NATIONS, nation, (c) => (nationPick = c))}
		{:else if scope === 'region'}
			{@render regionSelect('Region', REGIONS, region, (c) => (regionPick = c))}
		{:else if scope === 'event'}
			<LeaderboardEventPicker class="w-full lg:w-96" onpick={(code) => (eventPick = code)} />
		{/if}
	</div>

	{#snippet head()}
		<div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
			<div class="min-w-0">
				<h2 class="truncate text-lg font-semibold tracking-tight">{scopeName}</h2>
				{#if scope === 'event' && ev}
					<p class="truncate text-sm text-muted">{ev.code} · {dateRange(ev.start, ev.end)} · {place(ev.location)}</p>
				{/if}
			</div>
			<div class="flex shrink-0 items-center justify-between gap-3">
				<p class="text-xs text-muted">
					{scope === 'event' ? 'Ranked by OPR at this event (non-penalty)' : 'Ranked by best event OPR (non-penalty)'}
				</p>
				{#if scope === 'event' && ev}
					<a
						href="/events/{ev.season}/{ev.code}"
						class="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-3.5 text-sm font-medium whitespace-nowrap text-accent transition hover:bg-line"
					>
						Event page <Icon name="arrow" class="size-3.5" />
					</a>
				{/if}
			</div>
		</div>
	{/snippet}

	{#if scope === 'event' && eventCode === null && !resolving}
		<p class="card p-8 text-center text-sm text-muted">Search for an event to see its teams by OPR.</p>
	{:else if scope === 'event' ? event.isError : board.isError}
		<p class="card p-5 text-sm text-red-al">
			Couldn't load teams: {(scope === 'event' ? event.error : board.error)?.message}
		</p>
	{:else if scope === 'event' && event.isSuccess && !ev}
		<p class="card p-8 text-center text-sm text-muted">Event {eventCode} wasn't found this season.</p>
	{:else if resolving || (scope === 'event' ? event.isPending : board.isPending)}
		<div class="card space-y-2 p-4" aria-busy="true" aria-label="Loading teams">
			{#each { length: 8 } as _, i (i)}
				<div class="h-12 animate-pulse rounded-2xl bg-surface-2"></div>
			{/each}
		</div>
	{:else}
		<LeaderboardTable {rows} {season} {head} highlight={myTeam.current?.number ?? null} mode={scope === 'event' ? 'event' : 'season'} />

		{#if scope !== 'event'}
			<div class="mt-4 flex flex-col items-center gap-2 text-on-bg">
				<p class="text-sm text-on-bg/75">{boardRows.length.toLocaleString()} teams loaded</p>
				{#if board.hasNextPage}
					<button
						type="button"
						{@attach glass()}
						class="glass flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium disabled:opacity-60"
						disabled={board.isFetchingNextPage}
						onclick={() => board.fetchNextPage()}
					>
						{board.isFetchingNextPage ? 'Loading…' : 'Load more'}
					</button>
				{/if}
			</div>
		{:else if eventRows.length > 0}
			<p class="mt-4 text-center text-sm text-on-bg/75">
				{eventRows.length} teams · {eventRanked} with results
			</p>
		{/if}
	{/if}
</div>
