<script lang="ts">
	import { clock, pct } from '#lib/format.ts';
	import type { MatchPrediction } from '#lib/model/matchup.ts';
	import type { SeasonInfo } from '#lib/seasons/index.ts';
	import type { AllianceColor, MatchRow } from '#lib/types.ts';
	import Icon from './Icon.svelte';

	let {
		match,
		season,
		matchupHref,
		prediction = null,
		highlight = null,
		fresh = false
	}: {
		match: MatchRow;
		season: SeasonInfo;
		/** Matchup analysis page for this match. */
		matchupHref: string;
		/** Model prediction: live for upcoming matches, pre-match for played ones. */
		prediction?: MatchPrediction | null;
		highlight?: number | null;
		fresh?: boolean;
	} = $props();

	let open = $state(false);

	const alliances: { color: AllianceColor; label: string; text: string; dot: string }[] = [
		{ color: 'red', label: 'Red', text: 'text-red-al', dot: 'bg-red-al' },
		{ color: 'blue', label: 'Blue', text: 'text-blue-al', dot: 'bg-blue-al' }
	];
</script>

<!-- Desktop shows matches inside a white panel, so cards go flat grey there. -->
<article class="card overflow-hidden lg:rounded-3xl lg:bg-surface-2 lg:shadow-none {fresh ? 'fresh' : ''}">
	<!-- Played: tap to expand the breakdown. Upcoming: tap opens the matchup analysis. -->
	<svelte:element
		this={match.played ? 'button' : 'a'}
		type={match.played ? 'button' : undefined}
		href={match.played ? undefined : matchupHref}
		aria-expanded={match.played ? open : undefined}
		onclick={match.played ? () => (open = !open) : undefined}
		class="flex w-full items-stretch gap-1 text-left transition hover:bg-black/[0.02]"
		role={match.played ? undefined : 'link'}
	>
		<div class="flex w-16 shrink-0 flex-col items-center justify-center py-3">
			<span class="font-display text-lg leading-6">{match.label}</span>
			{#if !match.played && match.scheduledAt}
				<span class="mt-0.5 text-[11px] text-muted">{clock(match.scheduledAt)}</span>
			{:else if match.played && prediction && prediction.correct !== null}
				{@const fav = prediction.pRed >= 0.5 ? prediction.pRed : 1 - prediction.pRed}
				<!-- How the pre-match prediction did: favorite's odds, ✓ called / ✗ upset. -->
				<span
					class="mt-1 rounded-full px-1.5 text-[10px] font-semibold {prediction.correct ? 'bg-live/15 text-live' : 'bg-warn/15 text-warn'}"
					title="Pre-match prediction: {prediction.pRed >= 0.5 ? 'Red' : 'Blue'} {pct(fav)} to win. {prediction.correct ? 'Called it.' : 'Upset.'}"
				>
					{prediction.correct ? '✓' : '✗'} {pct(fav)}
				</span>
			{/if}
		</div>
		<div class="min-w-0 flex-1 py-2.5 pr-4">
			{#each alliances as a (a.color)}
				{@const side = match[a.color]}
				{@const won = match.winner === a.color}
				{@const lost = match.winner !== null && match.winner !== 'tie' && !won}
				<div class="flex h-9 items-center gap-3">
					<span class="size-2 shrink-0 rounded-full {a.dot}" aria-hidden="true"></span>
					<span class="sr-only">{a.label} alliance</span>
					<span class="flex min-w-0 flex-1 gap-x-3 text-sm {lost ? 'text-muted' : 'font-medium'}">
						{#each side.teams as t (t.number)}
							<span
								class="{t.number === highlight ? 'rounded-full bg-accent px-1.5 font-semibold text-white' : ''} {t.noShow || t.dq ? 'text-muted line-through' : ''}"
								title={t.surrogate ? 'Surrogate' : undefined}>{t.number}{t.surrogate ? '*' : ''}</span
							>
						{/each}
					</span>
					{#if side.score}
						{#if match.level === 'Quals'}
							<span class="flex items-center gap-1" aria-label="Ranking points">
								{#each season.rps as rp (rp.key)}
									<span
										class="size-1.5 rounded-full {side.score.rp[rp.key] ? a.dot : 'bg-line'}"
										title="{rp.label} RP{side.score.rp[rp.key] ? '' : ' (missed)'}"
									></span>
								{/each}
							</span>
						{/if}
						<span class="w-11 text-right font-display text-2xl leading-none {won ? a.text : lost ? 'text-muted' : ''}">
							{side.score.total}
						</span>
					{:else if prediction}
						{@const p = a.color === 'red' ? prediction.pRed : 1 - prediction.pRed}
						<span class="text-xs text-muted" title="Predicted score">~{Math.round(a.color === 'red' ? prediction.redScore : prediction.blueScore)}</span>
						<span class="w-11 text-right text-sm {p >= 0.5 ? `font-semibold ${a.text}` : 'text-muted'}" title="Win probability">
							{pct(p)}
						</span>
					{:else}
						<span class="w-11 text-right text-sm text-muted">–</span>
					{/if}
				</div>
			{/each}
		</div>
	</svelte:element>

	{#if !match.played && prediction}
		<!-- Win-probability split -->
		<div class="flex h-1" aria-hidden="true">
			<span class="bg-red-al transition-[width] duration-500" style:width="{prediction.pRed * 100}%"></span>
			<span class="flex-1 bg-blue-al"></span>
		</div>
	{/if}

	{#if open && match.red.score && match.blue.score}
		{@const red = match.red.score}
		{@const blue = match.blue.score}
		<!-- Team pages: links live here, never in the card header (it's a button). -->
		<div class="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line px-4 py-2 text-sm">
			<span class="eyebrow text-muted">Teams</span>
			{#each alliances as a (a.color)}
				<span class="flex items-center gap-1">
					<span class="mr-1 size-2 shrink-0 rounded-full {a.dot}" aria-hidden="true"></span>
					<span class="sr-only">{a.label} alliance</span>
					{#each match[a.color].teams as t (t.number)}
						<a
							href="/teams/{t.number}"
							class="flex h-8 items-center rounded-full px-1.5 hover:underline {t.number === highlight ? 'bg-accent font-semibold text-white' : 'font-medium hover:text-accent'}"
							>{t.number}</a
						>
					{/each}
				</span>
			{/each}
		</div>
		<div class="border-t border-line px-4 pt-2 pb-1">
			<table class="w-full text-sm">
				<thead>
					<tr>
						<th class="eyebrow py-2 text-left font-normal text-muted">Breakdown</th>
						<th class="eyebrow w-16 py-2 text-right font-normal text-red-al">Red</th>
						<th class="eyebrow w-16 py-2 text-right font-normal text-blue-al">Blue</th>
					</tr>
				</thead>
				<tbody>
					{#each red.breakdown as [label, value], i (label)}
						<tr class="border-t border-line/60">
							<td class="py-1.5 font-sans">{label}</td>
							<td class="py-1.5 text-right">{value}</td>
							<td class="py-1.5 text-right">{blue.breakdown[i][1]}</td>
						</tr>
					{/each}
					<tr class="border-t border-line font-semibold">
						<td class="py-2 font-sans">Score (no penalties)</td>
						<td class="py-2 text-right">{red.np}</td>
						<td class="py-2 text-right">{blue.np}</td>
					</tr>
					<tr class="border-t border-line/60">
						<td class="py-1.5 font-sans">Penalty points from opponent</td>
						<td class="py-1.5 text-right">{red.penaltyByOpp}</td>
						<td class="py-1.5 text-right">{blue.penaltyByOpp}</td>
					</tr>
					<tr class="border-t border-line font-semibold">
						<td class="py-2 font-sans">Final score</td>
						<td class="py-2 text-right">{red.total}</td>
						<td class="py-2 text-right">{blue.total}</td>
					</tr>
					{#if match.level === 'Quals'}
						{#each season.rps as rp (rp.key)}
							<tr class="border-t border-line/60">
								<td class="py-1.5 font-sans">{rp.label} RP</td>
								<td class="py-1.5 text-right">{red.rp[rp.key] ? '✓' : '–'}</td>
								<td class="py-1.5 text-right">{blue.rp[rp.key] ? '✓' : '–'}</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
		<a
			href={matchupHref}
			class="flex h-12 items-center justify-center gap-1.5 border-t border-line text-sm font-medium text-accent transition hover:bg-black/[0.02]"
		>
			Prediction vs result <Icon name="arrow" class="size-3.5" />
		</a>
	{/if}
</article>
