<script lang="ts">
	import { createQueries } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { query } from '#lib/api/client.ts';
	import { TeamMatchesQuery } from '#lib/api/queries.ts';
	import CompareCharts from '#lib/components/CompareCharts.svelte';
	import CompareMeetings from '#lib/components/CompareMeetings.svelte';
	import CompareTable from '#lib/components/CompareTable.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { teamQueryOptions } from '#lib/components/TeamOverview.svelte';
	import TeamPicker from '#lib/components/TeamPicker.svelte';
	import { num } from '#lib/format.ts';
	import { compareTeam, MAX_COMPARE, meetings, parseTeams, slotColor, type CompareTeam } from '#lib/model/compare.ts';
	import { CURRENT_SEASON, normalizeMatch, seasonInfo } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	const season = seasonInfo(CURRENT_SEASON);

	// `?teams=` is the source of truth. With no parameter at all, start from my team.
	const teams = $derived.by(() => {
		const param = page.url.searchParams.get('teams');
		if (param === null) return myTeam.current ? [myTeam.current.number] : [];
		return parseTeams(param);
	});

	function setTeams(list: number[]) {
		void goto(`${page.url.pathname}?teams=${list.join(',')}`, { replace: true, reset: false });
	}

	let adding = $state(false);
	const pickerOpen = $derived(teams.length < MAX_COMPARE && (adding || teams.length < 2));

	function add(n: number) {
		adding = false;
		if (!teams.includes(n)) setTeams([...teams, n].slice(0, MAX_COMPARE));
	}

	const teamResults = createQueries(() => ({ queries: teams.map((n) => teamQueryOptions(n)) }));

	const columns = $derived(
		teams.map((number, slot) => {
			const r = teamResults[slot];
			const data = r?.data?.teamByNumber;
			return {
				number,
				slot,
				team: data ? compareTeam(data, slot) : null,
				name: data?.name ?? (myTeam.current?.number === number ? myTeam.current.name : null),
				missing: !!r?.isSuccess && !data,
				error: r?.isError ? r.error.message : null
			};
		})
	);
	const shown = $derived(columns.filter((c) => !c.missing && !c.error));
	const loaded = $derived(shown.map((c) => c.team).filter((t): t is CompareTeam => t !== null));

	// A pair's shared matches are in either team's schedule, so the last team's list adds nothing.
	const shownNumbers = $derived(shown.map((c) => c.number));
	const matchResults = createQueries(() => ({
		queries: shownNumbers.map((n, i) => ({
			queryKey: ['teamMatches', n, CURRENT_SEASON],
			queryFn: ({ signal }: { signal: AbortSignal }) => query(TeamMatchesQuery, { number: n, season: CURRENT_SEASON }, signal),
			enabled: i < shownNumbers.length - 1,
			staleTime: 5 * 60_000
		}))
	}));
	const matchesPending = $derived(matchResults.some((r, i) => i < shownNumbers.length - 1 && r.isPending));

	const eventStart = $derived(new Map(loaded.flatMap((t) => t.events.map((e) => [e.code, e.start] as const))));
	const eventNames = $derived(new Map(loaded.flatMap((t) => t.events.map((e) => [e.code, e.name] as const))));
	const pairs = $derived(
		matchesPending
			? []
			: meetings(
					shownNumbers,
					matchResults.flatMap((r) =>
						(r.data?.teamByNumber?.matches ?? []).map((m) => ({ eventCode: m.eventCode, match: normalizeMatch(m.match) }))
					),
					eventStart
				)
	);
	const slots = $derived(new Map(shown.map((c) => [c.number, c.slot])));

	// What-if: two teams' best event OPRs added up.
	const duo = $derived(loaded.length === 2 && shown.length === 2 && loaded.every((t) => t.bestEvent) ? loaded : null);
</script>

<svelte:head><title>Compare{teams.length ? ` ${teams.join(' · ')}` : ''} · FTCPanel</title></svelte:head>
<svelte:window onkeydown={(e) => e.key === 'Escape' && (adding = false)} />

<div class="mx-auto max-w-screen-2xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	<header class="mb-8 text-ink">
		<p class="text-ink/75">
			{season.name} · {CURRENT_SEASON}–{(CURRENT_SEASON + 1) % 100}
		</p>
		<h1 class="mt-1 font-display text-5xl">Compare</h1>

		<ul class="mt-5 flex flex-wrap items-center gap-2" aria-label="Compared teams">
			{#each columns as c (c.number)}
				<li class="chip flex min-h-11 max-w-full items-center rounded-3xl py-0.5 pr-0.5 pl-4 text-sm">
					<span class="mr-2 size-2.5 shrink-0 rounded-full" style:background={slotColor(c.slot)}></span>
					<a href="/teams/{c.number}" class="flex min-w-0 items-baseline gap-1.5 hover:underline">
						<span class="font-semibold">{c.number}</span>
						{#if c.missing}
							<span class="text-ink/75">not found</span>
						{:else if c.name}
							<span class="min-w-0 text-ink/75 wrap-anywhere">{c.name}</span>
						{/if}
					</a>
					<button
						type="button"
						class="ml-1 grid size-10 shrink-0 place-items-center rounded-full hover:bg-current/10"
						aria-label="Remove {c.number}"
						onclick={() => setTeams(teams.filter((n) => n !== c.number))}
					>
						<Icon name="close" class="size-4" />
					</button>
				</li>
			{/each}
			{#if teams.length >= 2 && teams.length < MAX_COMPARE}
				<li>
					<button
						type="button"
						class="chip flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium"
						aria-expanded={adding}
						onclick={() => (adding = !adding)}
					>
						<Icon name={adding ? 'close' : 'search'} class="size-4" />
						{adding ? 'Cancel' : 'Add team'}
					</button>
				</li>
			{/if}
		</ul>

		{#if pickerOpen}
			<div class="mt-4 max-w-md">
				{#if teams.length < 2}
					<p class="mb-2 text-sm text-ink/75">
						{teams.length === 0
							? 'Pick two to four teams to compare.'
							: `Add a team to compare with ${teams[0]}.`}
					</p>
				{/if}
				<TeamPicker autofocus={adding} onpick={(t) => add(t.number)} />
			</div>
		{/if}
	</header>

	{#if shown.length > 0}
		<div class="space-y-4">
			{#each columns.filter((c) => c.error) as c (c.number)}
				<p class="card p-5 text-sm text-red-al">Couldn't load team {c.number}: {c.error}</p>
			{/each}

			<CompareTable columns={shown} {season} />

			{#if loaded.length > 0}
				<CompareCharts teams={loaded} {season} />
			{:else}
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div class="card h-80 animate-pulse"></div>
					<div class="card h-80 animate-pulse"></div>
				</div>
			{/if}

			<div class="grid grid-cols-1 items-start gap-4 {duo ? 'xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]' : ''}">
				{#if shown.length >= 2}
					<CompareMeetings {pairs} {slots} {eventNames} pending={matchesPending} teamCount={shown.length} />
				{/if}

				{#if duo}
					{@const [a, b] = duo}
					<section class="card p-5 sm:p-6" aria-label="What if they teamed up">
						<h2 class="text-lg font-semibold tracking-tight">What if they teamed up?</h2>
						<p class="mt-3 text-sm text-muted">Together they'd average</p>
						<p class="font-display text-5xl text-accent">
							~{Math.round(a.bestEvent!.stats.oprNp + b.bestEvent!.stats.oprNp)}<span class="ml-1.5 text-lg text-muted">points</span>
						</p>
						<div class="mt-4 grid grid-cols-2 gap-2.5">
							{#each duo as t (t.number)}
								<div class="min-w-0 rounded-2xl bg-surface-2 p-4">
									<p class="flex items-center gap-1.5 text-xs text-muted">
										<span class="size-2 shrink-0 rounded-full" style:background={slotColor(t.slot)}></span>{t.number} best OPR
									</p>
									<p class="mt-1 font-display text-2xl leading-none">{num(t.bestEvent!.stats.oprNp)}</p>
									<p class="mt-1 line-clamp-2 text-xs text-muted wrap-anywhere" title={t.bestEvent!.name}>{t.bestEvent!.name}</p>
								</div>
							{/each}
						</div>
						<p class="mt-3 text-xs text-muted">
							An estimate: the sum of each team's best event OPR (without penalty points). Real alliances score differently
							once they share the field.
						</p>
					</section>
				{/if}
			</div>
		</div>
	{/if}
</div>
