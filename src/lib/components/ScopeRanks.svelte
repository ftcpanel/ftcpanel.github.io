<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import type { RegionOption } from '#lib/api/gql/graphql.ts';
	import { EventTeamStatsQuery, RegionLeagueEventsQuery, TeamScopeRanksQuery } from '#lib/api/queries.ts';
	import { normalizeStats } from '#lib/seasons/index.ts';

	let {
		team,
		season,
		country,
		events,
		global
	}: {
		team: number;
		season: number;
		/** Team location country, for the nation label. */
		country: string;
		/** The team's events this season (FIRST region and league codes). */
		events: { regionCode?: string | null; leagueCode?: string | null }[];
		/** Worldwide season OPR rank (quickStats without a region). */
		global: { rank: number; count: number } | null;
	} = $props();

	function mostCommon(values: (string | null | undefined)[]): string | null {
		const n = new Map<string, number>();
		for (const v of values) if (v) n.set(v, (n.get(v) ?? 0) + 1);
		return [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
	}

	// FIRST region codes double as `RegionOption`s (USCALS, KZ, CAON, …). Nations: the US has its own
	// option; elsewhere a two-letter region is the whole country. Others (e.g. Canadian provinces) have none.
	const region = $derived(mostCommon(events.map((e) => e.regionCode)) as RegionOption | null);
	const nation = $derived<RegionOption | null>(
		!region ? null : region.startsWith('US') ? 'UnitedStates' : region.length === 2 ? region : null
	);
	const league = $derived(mostCommon(events.map((e) => e.leagueCode)));

	const scoped = createQuery(() => ({
		queryKey: ['scopeRanks', team, season, region, nation],
		queryFn: ({ signal }) =>
			query(TeamScopeRanksQuery, { number: team, season, region: region!, nation: nation ?? region! }, signal),
		enabled: region !== null
	}));

	// No league rankings in the API: rank by best OPR across the league's meets and tournament.
	const leagueRank = createQuery(() => ({
		queryKey: ['leagueRank', team, season, region, league],
		queryFn: async ({ signal }) => {
			const all = await query(RegionLeagueEventsQuery, { season, region: region! }, signal);
			const codes = [...all.meets, ...all.tournaments].filter((e) => e.leagueCode === league).map((e) => e.code);
			const best = new Map<number, number>();
			for (const res of await Promise.all(codes.map((code) => query(EventTeamStatsQuery, { season, code }, signal)))) {
				for (const t of res.eventByCode?.teams ?? []) {
					const s = normalizeStats(t.stats);
					if (!s || s.played === 0) continue;
					best.set(t.teamNumber, Math.max(best.get(t.teamNumber) ?? -Infinity, s.oprNp));
				}
			}
			const mine = best.get(team);
			if (mine === undefined) return null;
			return { rank: [...best.values()].filter((v) => v > mine).length + 1, count: best.size };
		},
		enabled: region !== null && league !== null,
		staleTime: 10 * 60_000
	}));

	interface Tile {
		label: string;
		sub: string;
		value: { rank: number; count: number } | null;
		pending: boolean;
	}
	const fromStats = (q: { count: number; tot: { rank: number } } | null | undefined) =>
		q ? { rank: q.tot.rank, count: q.count } : null;

	const tiles = $derived.by(() => {
		const out: Tile[] = [];
		if (league)
			out.push({ label: 'League', sub: `${league} · by OPR`, value: leagueRank.data ?? null, pending: leagueRank.isPending });
		const sameAsNation = region !== null && region === nation;
		if (region && !sameAsNation)
			out.push({ label: 'Region', sub: region, value: fromStats(scoped.data?.teamByNumber?.region), pending: scoped.isPending });
		if (nation)
			out.push({ label: 'Nation', sub: country, value: fromStats(scoped.data?.teamByNumber?.nation), pending: scoped.isPending });
		out.push({ label: 'Global', sub: 'Worldwide', value: global, pending: false });
		return out;
	});
</script>

<section class="card p-5 sm:p-6" aria-label="Season rank by area">
	<div class="mb-4">
		<h2 class="text-lg font-semibold tracking-tight">Where you stand</h2>
		<p class="text-sm text-muted">Season OPR rank, from league up to the world</p>
	</div>
	<div class="grid grid-cols-2 gap-3 md:grid-cols-[repeat(var(--n),minmax(0,1fr))]" style:--n={tiles.length}>
		{#each tiles as tile (tile.label)}
			{@const top = tile.value ? (tile.value.rank / tile.value.count) * 100 : null}
			<div class="rounded-3xl bg-surface-2 p-4">
				<p class="eyebrow text-muted">{tile.label}</p>
				<p class="text-xs break-words text-muted">{tile.sub}</p>
				{#if tile.value}
					<p class="mt-2 font-display text-4xl leading-none">
						#{tile.value.rank.toLocaleString()}<span class="text-base text-muted"> / {tile.value.count.toLocaleString()}</span>
					</p>
					<div class="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
						<span class="block h-full rounded-full bg-accent" style:width="{Math.max(3, 100 - top!)}%"></span>
					</div>
					<p class="mt-1.5 text-xs font-medium text-accent">Top {top! < 10 ? top!.toFixed(1) : Math.round(top!)}%</p>
				{:else if tile.pending}
					<div class="mt-2 h-9 w-24 animate-pulse rounded-xl bg-line"></div>
				{:else}
					<p class="mt-2 text-sm text-muted">Not ranked yet</p>
				{/if}
			</div>
		{/each}
	</div>
</section>
