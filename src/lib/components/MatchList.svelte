<script lang="ts">
	import type { MatchPrediction } from '#lib/model/matchup.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';
	import type { MatchRow } from '#lib/types.ts';
	import MatchCard from './MatchCard.svelte';

	let {
		matches,
		season,
		predictions,
		eventPath,
		highlight = null,
		fresh
	}: {
		matches: MatchRow[];
		season: SeasonInfo;
		/** Per-match predictions (LiveEvent.predictions). */
		predictions: Map<number, MatchPrediction>;
		/** e.g. /events/2026/USMNSAQ2 */
		eventPath: string;
		highlight?: number | null;
		fresh: ReadonlySet<number>;
	} = $props();

	/** Out-of-sample record of the model at this event. */
	const record = $derived.by(() => {
		let called = 0;
		let decided = 0;
		for (const p of predictions.values()) {
			if (p.correct === null) continue;
			decided++;
			if (p.correct) called++;
		}
		return { called, decided };
	});

	let onlyMine = $state(false);
	const hasMine = $derived(
		highlight !== null &&
			matches.some((m) => [...m.red.teams, ...m.blue.teams].some((t) => t.number === highlight))
	);
	const shown = $derived(
		onlyMine && hasMine
			? matches.filter((m) =>
					[...m.red.teams, ...m.blue.teams].some((t) => t.number === highlight)
				)
			: matches
	);
	const UPCOMING_PREVIEW = 8;
	let allUpcoming = $state(false);
	const upcoming = $derived(shown.filter((m) => !m.played));
	// Next matches first, then results newest first: the latest result is always near the top.
	const groups = $derived(
		[
			{
				label: 'Up next',
				rows: allUpcoming ? upcoming : upcoming.slice(0, UPCOMING_PREVIEW),
				hidden: allUpcoming ? 0 : Math.max(0, upcoming.length - UPCOMING_PREVIEW)
			},
			{ label: 'Results', rows: shown.filter((m) => m.played).reverse(), hidden: 0 }
		].filter((g) => g.rows.length > 0)
	);
</script>

<div class="mb-4 flex flex-wrap items-center gap-2">
	{#if record.decided > 0}
		<span
			class="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm shadow-[var(--card-shadow)] lg:bg-surface-2 lg:shadow-none"
			title="Each played match was predicted using only the matches before it."
		>
			<span class="font-semibold">Model called {record.called}/{record.decided}</span>
			<span class="text-muted">{Math.round((record.called / record.decided) * 100)}%</span>
		</span>
	{/if}
	{#if hasMine}
		<button
			type="button"
			aria-pressed={onlyMine}
			onclick={() => (onlyMine = !onlyMine)}
			class="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition {onlyMine
				? 'bg-accent text-white'
				: 'bg-surface text-muted shadow-[var(--card-shadow)] hover:text-ink lg:bg-surface-2 lg:shadow-none'}"
		>
			<span class="size-2 rounded-full {onlyMine ? 'bg-white' : 'bg-accent'}"></span>
			Only {highlight}
		</button>
	{/if}
</div>

{#if matches.length === 0}
	<p class="card p-8 text-center text-sm text-muted lg:bg-surface-2 lg:shadow-none">
		No matches posted yet. This page updates automatically.
	</p>
{:else}
	<div class="space-y-6">
		{#each groups as g (g.label)}
			<section>
				<!-- Phones: on the page background. Desktop: inside the white matches panel. -->
				<h3 class="mb-3 text-sm font-semibold text-ink/85 lg:text-muted">{g.label}</h3>
				<div class="space-y-2.5">
					{#each g.rows as m (m.id)}
						<MatchCard
							match={m}
							{season}
							{highlight}
							fresh={fresh.has(m.id)}
							matchupHref="{eventPath}/matchup?match={m.id}"
							prediction={predictions.get(m.id) ?? null}
						/>
					{/each}
				</div>
				{#if g.hidden}
					<button type="button" class="mt-3 h-10 text-sm font-medium text-ink lg:text-accent" onclick={() => (allUpcoming = true)}>
						+ {g.hidden} more scheduled
					</button>
				{/if}
			</section>
		{/each}
	</div>
{/if}
