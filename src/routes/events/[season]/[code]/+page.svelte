<script lang="ts">
	import { page } from '$app/state';
	import BracketView from '#lib/components/BracketView.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import MatchList from '#lib/components/MatchList.svelte';
	import MyTeamAtEvent from '#lib/components/MyTeamAtEvent.svelte';
	import RankingsTable from '#lib/components/RankingsTable.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import HeroChart from '#lib/components/HeroChart.svelte';
	import { dateRange, eventType, num } from '#lib/format.ts';
	import { acquireLiveEvent, type LiveEvent } from '#lib/live/liveEvent.svelte.ts';
	import { isSupportedSeason, seasonInfo } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	const season = $derived(Number(page.params.season));
	const code = $derived((page.params.code ?? '').toUpperCase());
	const supported = $derived(isSupportedSeason(season));

	let feed = $state<LiveEvent | null>(null);
	$effect(() => {
		if (!supported) return;
		const { feed: f, release } = acquireLiveEvent(season, code);
		feed = f;
		return release;
	});

	const info = $derived(feed?.info);
	const mine = $derived(
		myTeam.current && feed?.rankings.some((r) => r.team === myTeam.current!.number)
			? myTeam.current.number
			: null
	);
	const played = $derived((feed?.matches ?? []).filter((m) => m.played && m.red.score && m.blue.score));
	const scores = $derived(played.flatMap((m) => [m.red.score!.np, m.blue.score!.np]));
	/** Mean alliance score (no penalties) per played match, in play order, smoothed. */
	const trend = $derived.by(() => {
		const raw = played.map((m) => (m.red.score!.np + m.blue.score!.np) / 2);
		// Rolling mean so the line shows the trend rather than match-to-match noise.
		const w = Math.max(1, Math.round(raw.length / 10));
		return raw.map((_, i) => {
			const win = raw.slice(Math.max(0, i - w + 1), i + 1);
			return win.reduce((a, b) => a + b, 0) / win.length;
		});
	});

	let tab = $state<'rankings' | 'matches' | 'bracket'>('rankings');
</script>

<svelte:head><title>{info?.name ?? code} · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-screen-2xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	{#if !supported}
		<p class="card p-6 text-sm">
			Season {page.params.season} isn't supported yet. FTCPanel currently covers {seasonInfo(2026).name} (2026).
		</p>
	{:else if feed?.notFound}
		<p class="card p-6 text-sm">
			Event <strong>{code}</strong> wasn't found on FTC Scout.
			<a href="/events" class="text-accent underline">Browse events</a>
		</p>
	{:else if feed}
		<!-- Page header -->
		<section class="hero relative text-ink" aria-label="Event overview">
			<div class="flex items-center justify-between gap-3">
				<a href="/events" class="chip grid size-11 place-items-center rounded-full" aria-label="Back to events">
					<Icon name="back" class="size-5" />
				</a>
				{#if info?.streamUrl}
					<a href={info.streamUrl} target="_blank" rel="noreferrer" class="chip flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium">
						<Icon name="play" class="size-4" /> Watch
					</a>
				{/if}
			</div>

			{#if info}
				<div class="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-end">
					<div class="min-w-0">
						<p class="text-ink/75">{eventType(info.type)} · {dateRange(info.start, info.end)}</p>
						<h1 class="mt-1 font-display text-4xl leading-tight sm:text-5xl">{info.name}</h1>
						<p class="mt-1 text-ink/75">{info.venue ? `${info.venue} · ` : ''}{info.place}</p>

						<p class="mt-8 text-ink/80">Average alliance score</p>
						<div class="flex flex-wrap items-end gap-x-4 gap-y-2">
							<p class="font-display text-7xl leading-none">
								{scores.length ? num(scores.reduce((a, b) => a + b, 0) / scores.length) : '–'}<span class="ml-2 text-xl text-ink/75">pts</span>
							</p>
							<div class="mb-2 flex flex-wrap gap-2 text-sm font-medium">
								<span class="chip rounded-full px-3 py-1">High {scores.length ? Math.max(...scores) : '–'}</span>
								{#if played.length}
									<!-- Alliance accents: how often each side has won here. -->
									<span class="chip flex items-center gap-2 rounded-full px-3 py-1" title="Matches won by each alliance">
										<span class="size-2 rounded-full bg-red-al"></span>{played.filter((m) => m.winner === 'red').length}
										<span class="text-ink/60">vs</span>
										<span class="size-2 rounded-full bg-blue-al"></span>{played.filter((m) => m.winner === 'blue').length}
									</span>
								{/if}
								<span class="chip rounded-full px-3 py-1">{played.length}/{feed.matches.length} matches</span>
								<span class="chip rounded-full px-3 py-1">{feed.rankings.length} teams</span>
							</div>
						</div>
					</div>

					<div class="min-w-0">
						{#if trend.length >= 2}
							<p class="mb-1 text-sm text-ink/80">Scoring trend</p>
							<HeroChart
								values={trend}
								labels={played.map((m) => m.label)}
								note="Latest {num(trend.at(-1))} pts"
								label="Average alliance score per match, in play order"
							/>
						{/if}
						<a
							href="/events/{season}/{code}/matchup"
							class="mt-5 flex h-13 items-center justify-between rounded-full bg-white pr-2 pl-6 font-medium text-[#16161d] shadow-[0_12px_30px_-12px_rgb(0_0_0/0.4)] transition hover:-translate-y-0.5"
						>
							Matchup predictor
							<span class="grid size-9 place-items-center rounded-full bg-[#16161d] text-white">
								<Icon name="arrow-up-right" class="size-4" />
							</span>
						</a>
					</div>
				</div>
			{:else}
				<div class="mt-8 h-10 w-2/3 animate-pulse rounded-full bg-ink/15"></div>
				<div class="mt-3 h-4 w-1/3 animate-pulse rounded-full bg-ink/15"></div>
				<div class="mt-10 h-20 w-1/2 animate-pulse rounded-3xl bg-ink/10"></div>
			{/if}
		</section>

		{#if feed.error && feed.info}
			<p class="card mt-4 px-5 py-3 text-sm text-warn">Last refresh failed: {feed.error}. Showing the last loaded data.</p>
		{/if}

		{#if feed.status === 'error' && !feed.info}
			<p class="card mt-8 p-6 text-sm text-red-al">Couldn't load this event: {feed.error}</p>
		{:else if info}
			<div class="mt-8 space-y-4 lg:space-y-6">
				{#if mine}
					<MyTeamAtEvent
						team={mine}
						matches={feed.matches}
						rankings={feed.rankings}
						predictions={feed.predictions}
						eventPath="/events/{season}/{code}"
					/>
				{/if}

				<!-- Phones/tablets: tabs. Desktop: bracket on top (when there are playoffs), then rankings and matches side by side. -->
				<div class="sticky top-0 z-20 -mx-4 px-4 py-2 lg:hidden">
					<Segmented
						bind:value={tab}
						options={[
							{ value: 'rankings', label: 'Rankings' },
							{ value: 'matches', label: 'Matches', badge: feed.fresh.size > 0 && tab !== 'matches' ? `${feed.fresh.size} new` : null },
							...(feed.playoffs ? [{ value: 'bracket' as const, label: 'Bracket' }] : [])
						]}
					/>
				</div>

				{#if feed.playoffs}
					<div class={tab === 'bracket' ? '' : 'hidden lg:block'}>
						<BracketView playoffs={feed.playoffs} highlight={mine} eventPath="/events/{season}/{code}" />
					</div>
				{/if}

				<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
					<section class={tab === 'rankings' ? '' : 'hidden lg:block'} aria-label="Rankings">
						<RankingsTable rows={feed.rankings} season={seasonInfo(season)} highlight={mine} />
					</section>
					<!-- Desktop: one white panel; phones: cards straight on the page. -->
					<section
						class="{tab === 'matches' ? '' : 'hidden lg:block'} lg:card lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:p-4"
						aria-label="Matches"
					>
						<h2 class="mb-3 hidden px-2 pt-1 text-lg font-semibold tracking-tight lg:block">Matches</h2>
						<MatchList
							matches={feed.matches}
							season={seasonInfo(season)}
							predictions={feed.predictions}
							eventPath="/events/{season}/{code}"
							highlight={mine}
							fresh={feed.fresh}
						/>
					</section>
				</div>
			</div>
		{/if}
	{/if}
</div>
