<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import MatchupView, { type MatchupMode } from '#lib/components/MatchupView.svelte';
	import { acquireLiveEvent, type LiveEvent } from '#lib/live/liveEvent.svelte.ts';
	import { fitEventModel, predictMatchup } from '#lib/model/matchup.ts';
	import { isSupportedSeason, seasonInfo } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';

	const season = $derived(Number(page.params.season));
	const code = $derived((page.params.code ?? '').toUpperCase());
	const supported = $derived(isSupportedSeason(season));
	const info = $derived(supported ? seasonInfo(season) : null);

	let feed = $state<LiveEvent | null>(null);
	$effect(() => {
		if (!supported) return;
		const { feed: f, release } = acquireLiveEvent(season, code);
		feed = f;
		return release;
	});

	const teamList = $derived(
		[...(feed?.rankings ?? [])].sort((a, b) => a.team - b.team).map((r) => ({ team: r.team, name: r.name }))
	);
	const names = $derived(new Map(teamList.map((t) => [t.team, t.name])));
	const mine = $derived(myTeam.current && names.has(myTeam.current.number) ? myTeam.current.number : null);

	const parseTeams = (v: string | null) =>
		(v ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 2);

	const matchId = $derived(page.url.searchParams.has('match') ? Number(page.url.searchParams.get('match')) : null);
	const match = $derived(matchId === null ? null : (feed?.matches.find((m) => m.id === matchId) ?? null));

	/** Alliances: from ?match, else ?red/?blue, else my next match, else seeds 1+4 vs 2+3. */
	const alliances = $derived.by((): { red: number[]; blue: number[] } | null => {
		if (!feed) return null;
		if (match) return { red: match.red.teams.map((t) => t.number), blue: match.blue.teams.map((t) => t.number) };
		const red = parseTeams(page.url.searchParams.get('red'));
		const blue = parseTeams(page.url.searchParams.get('blue'));
		if (red.length && blue.length) return { red, blue };
		const next = mine === null ? null : feed.matches.find((m) => !m.played && [...m.red.teams, ...m.blue.teams].some((t) => t.number === mine));
		if (next) return { red: next.red.teams.map((t) => t.number), blue: next.blue.teams.map((t) => t.number) };
		const seeds = feed.rankings.map((r) => r.team);
		if (seeds.length < 4) return null;
		return { red: [seeds[0], seeds[3]], blue: [seeds[1], seeds[2]] };
	});

	const prediction = $derived.by(() => {
		if (!feed || !alliances || !info) return null;
		// Played match: predict from the matches before it, so the comparison with the result is honest.
		let model = feed.model;
		if (match?.played) {
			const idx = feed.matches.indexOf(match);
			model = fitEventModel(
				feed.matches.slice(0, idx),
				feed.rankings.map((r) => r.team),
				feed.priors,
				info.components.map((c) => c.key)
			);
		}
		return predictMatchup(model, alliances.red, alliances.blue);
	});
	const played = $derived(Boolean(match?.played && match.red.score && match.blue.score));

	/** Played matches open on the result; `?view=prediction` shows the pre-match projection. */
	const mode = $derived<MatchupMode>(played && page.url.searchParams.get('view') !== 'prediction' ? 'result' : 'prediction');
	const modes: { value: MatchupMode; label: string }[] = [
		{ value: 'result', label: 'Result' },
		{ value: 'prediction', label: 'Pre-match prediction' }
	];
	function setMode(next: MatchupMode) {
		const q = new URLSearchParams(page.url.search);
		if (next === 'prediction') q.set('view', 'prediction');
		else q.delete('view');
		void goto(`?${q}`, { replace: true, reset: false });
	}

	function setTeams(red: number[], blue: number[]) {
		const q = new URLSearchParams({ red: red.join(','), blue: blue.join(',') });
		void goto(`?${q}`, { replace: true, reset: false });
	}
	function pick(side: 'red' | 'blue', slot: number, team: number) {
		if (!alliances) return;
		const next = { red: [...alliances.red], blue: [...alliances.blue] };
		next[side][slot] = team;
		setTeams(next.red, next.blue);
	}
</script>

<svelte:head><title>Matchup · {code} · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-screen-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10">
	{#if !supported || !info}
		<p class="card p-6 text-sm">Season {page.params.season} isn't supported yet.</p>
	{:else if feed}
		{#snippet header()}
			<div class="flex items-center gap-3">
				<a href="/events/{season}/{code}" class="chip grid size-11 shrink-0 place-items-center rounded-full" aria-label="Back to event">
					<Icon name="back" class="size-5" />
				</a>
				<div class="min-w-0">
					<h1 class="font-display text-3xl leading-tight">Matchup{#if match}<span class="text-ink/70"> · {match.label}</span>{/if}</h1>
					<p class="truncate text-sm text-ink/75">{feed?.info?.name ?? code}</p>
				</div>
			</div>

			{#if played}
				<Segmented bind:value={() => mode, setMode} options={modes} class="mt-6 sm:max-w-sm" />
			{/if}

			<!-- The result shows its alliances in the hero; pickers are for exploring predictions. -->
			{#if alliances && mode === 'prediction'}
				<!-- Alliance pickers: native selects are the most usable control on phones. -->
				<div class="mt-6 grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
					{#each ['red', 'blue'] as const as side, si (side)}
						{#if si === 1}
							<button
								type="button"
								onclick={() => setTeams(alliances.blue, alliances.red)}
								class="chip mx-auto grid size-10 place-items-center rounded-full"
								aria-label="Swap alliances"
							>
								<Icon name="swap" class="size-4" />
							</button>
						{/if}
						<fieldset class="chip rounded-[1.75rem] p-1.5">
							<legend class="sr-only">{side === 'red' ? 'Red' : 'Blue'} alliance</legend>
							<div class="grid grid-cols-2 gap-1.5">
								{#each alliances[side] as team, slot (slot)}
									<label class="relative block min-w-0">
										<span class="sr-only">{side} team {slot + 1}</span>
										<span class="pointer-events-none absolute top-1/2 left-3.5 size-2.5 -translate-y-1/2 rounded-full {side === 'red' ? 'bg-red-al' : 'bg-blue-al'}"></span>
										<select
											value={team}
											onchange={(e) => pick(side, slot, Number(e.currentTarget.value))}
											class="h-12 w-full min-w-0 appearance-none truncate rounded-3xl bg-surface pr-8 pl-8 text-sm font-semibold text-ink"
										>
											{#each teamList as t (t.team)}
												<option value={t.team}>{t.team} {t.name}</option>
											{/each}
										</select>
										<Icon name="chevron" class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
									</label>
								{/each}
							</div>
						</fieldset>
					{/each}
				</div>
			{/if}
		{/snippet}

		{#if feed.status === 'loading' && !feed.info}
			<section class="relative h-80 text-ink">
				{@render header()}
			</section>
		{:else if !alliances || !prediction || !feed.model.hasData}
			<section class="relative pb-4 text-ink">
				{@render header()}
				<p class="mt-8 max-w-lg text-ink/85">
					{#if !alliances}
						Not enough teams registered to build a matchup yet.
					{:else}
						No matches played here yet and none of these teams have earlier-event stats this season.
						Predictions appear as soon as the first matches are posted.
					{/if}
				</p>
			</section>
		{:else}
			<MatchupView prediction={prediction} season={info} {names} perspective={mine} {match} bind:mode={() => mode, setMode} {header} />
		{/if}
		<p class="mt-6 px-2 text-xs text-ink/75">
			{#if match && !match.played}Updates live as other matches are posted. {/if}Model: per-phase OPR fitted live on this
			event's matches, blended with each team's earlier-event stats. Backtested on 645 qualification matches: 75% of
			winners called correctly.
		</p>
	{/if}
</div>
