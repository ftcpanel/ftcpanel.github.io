<script lang="ts">
	import { clock, num, pct, record } from '#lib/format.ts';
	import type { MatchPrediction } from '#lib/model/matchup.ts';
	import type { AllianceColor, MatchRow, RankingRow } from '#lib/types.ts';
	import Icon from './Icon.svelte';
	import Ring from './Ring.svelte';

	let {
		team,
		matches,
		rankings,
		predictions,
		eventPath
	}: {
		team: number;
		matches: MatchRow[];
		rankings: RankingRow[];
		/** LiveEvent.predictions: live for upcoming matches, pre-match for played ones. */
		predictions: Map<number, MatchPrediction>;
		eventPath: string;
	} = $props();

	function sideOf(m: MatchRow): AllianceColor | null {
		if (m.red.teams.some((t) => t.number === team)) return 'red';
		if (m.blue.teams.some((t) => t.number === team)) return 'blue';
		return null;
	}

	const mine = $derived(
		matches.flatMap((m) => {
			const side = sideOf(m);
			return side ? [{ m, side, opp: (side === 'red' ? 'blue' : 'red') as AllianceColor }] : [];
		})
	);
	const next = $derived(mine.find((x) => !x.m.played));
	const last = $derived(mine.findLast((x) => x.m.played));
	const row = $derived(rankings.find((r) => r.team === team));
	const ranked = $derived(rankings.filter((r) => r.stats).length);
	/** My side's win probability for a match, if the model has one. */
	const myWin = (x: { m: MatchRow; side: AllianceColor }) => {
		const p = predictions.get(x.m.id);
		return p ? (x.side === 'red' ? p.pRed : 1 - p.pRed) : null;
	};
	const nextWin = $derived(next ? myWin(next) : null);
	const upcoming = $derived(mine.filter((x) => !x.m.played));
	const expectedWins = $derived(upcoming.reduce((s, x) => s + (myWin(x) ?? 0), 0));
	let showPlayed = $state(false);
	const others = (x: { m: MatchRow; side: AllianceColor }) =>
		x.m[x.side].teams.filter((t) => t.number !== team).map((t) => t.number).join(', ') || '—';
	const dot = { red: 'bg-red-al', blue: 'bg-blue-al' };
</script>

{#if row}
	<div class="space-y-3 sm:space-y-4">
	<!-- Phones: rank + last side by side, next match full width. sm+: three across. -->
	<section class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4" aria-label="My team at this event">
		<div class="card p-5">
			<p class="eyebrow text-muted">{team} rank</p>
			{#if row.stats}
				<p class="mt-2 font-display text-5xl leading-none text-accent">
					{row.stats.rank}<span class="text-xl text-muted">/{ranked}</span>
				</p>
				<p class="mt-3 text-sm text-muted">{record(row.stats)} · RS {num(row.stats.rs, 2)}</p>
			{:else}
				<p class="mt-2 text-lg font-medium text-muted">Not ranked yet</p>
			{/if}
		</div>

		<svelte:element
			this={next ? 'a' : 'div'}
			href={next ? `${eventPath}/matchup?match=${next.m.id}` : undefined}
			class="card group order-last col-span-2 flex items-center gap-4 p-5 sm:order-none sm:col-span-1 {next ? 'transition hover:-translate-y-0.5' : ''}"
		>
			{#if next}
				<div class="min-w-0 flex-1">
					<p class="eyebrow text-muted">
						Next · {next.m.label}{#if next.m.scheduledAt}&nbsp;at {clock(next.m.scheduledAt)}{/if}
					</p>
					<p class="mt-3 flex items-center gap-2 text-sm">
						<span class="size-2 rounded-full {dot[next.side]}"></span>
						with <span class="font-medium">{others(next)}</span>
					</p>
					<p class="mt-1 flex items-center gap-2 text-sm text-muted">
						<span class="size-2 rounded-full {dot[next.opp]}"></span>
						vs {next.m[next.opp].teams.map((t) => t.number).join(', ')}
					</p>
				</div>
				{#if nextWin !== null}
					<Ring value={nextWin} size={84} stroke={8} color="var(--accent)" label="Win probability {pct(nextWin)}">
						<div class="text-center">
							<p class="font-display text-xl leading-none">{pct(nextWin)}</p>
							<p class="text-[11px] text-muted">to win</p>
						</div>
					</Ring>
				{/if}
				<span class="grid size-9 shrink-0 place-items-center self-start rounded-full bg-surface-2 text-muted transition group-hover:bg-ink group-hover:text-bg">
					<Icon name="arrow-up-right" class="size-4" />
				</span>
			{:else}
				<div>
					<p class="eyebrow text-muted">Next match</p>
					<p class="mt-2 text-lg font-medium text-muted">None scheduled</p>
				</div>
			{/if}
		</svelte:element>

		<div class="card p-5">
			{#if last && last.m[last.side].score && last.m[last.opp].score}
				{@const outcome = last.m.winner === 'tie' ? 'Tie' : last.m.winner === last.side ? 'Win' : 'Loss'}
				<p class="eyebrow text-muted">Last · {last.m.label}</p>
				<p class="mt-2 font-display text-3xl leading-none whitespace-nowrap sm:text-4xl">
					{last.m[last.side].score!.total}<span class="text-muted">–</span>{last.m[last.opp].score!.total}
				</p>
				<p class="mt-3 flex items-center gap-2 text-sm">
					<span class="rounded-full px-2 py-0.5 text-xs font-semibold {outcome === 'Win' ? 'bg-live/15 text-live' : outcome === 'Loss' ? 'bg-red-al/15 text-red-al' : 'bg-line text-muted'}">{outcome}</span>
					<span class="min-w-0 break-words text-muted">with {others(last)}</span>
				</p>
			{:else}
				<p class="eyebrow text-muted">Last match</p>
				<p class="mt-2 text-lg font-medium text-muted">—</p>
			{/if}
		</div>
	</section>

	<!-- Every match on my schedule: upcoming with my win probability, played with result. -->
	<section class="card p-5 sm:p-6" aria-label="My matches">
		<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<h2 class="text-lg font-semibold tracking-tight">{team}'s matches</h2>
			{#if upcoming.length && predictions.size}
				<p class="text-sm text-muted">
					Expected <span class="font-semibold text-ink">{expectedWins.toFixed(1)}</span> wins from {upcoming.length} left
				</p>
			{/if}
		</div>
		{#if mine.length === 0}
			<p class="rounded-2xl bg-surface-2 p-5 text-center text-sm text-muted">
				The match schedule isn't posted yet. Your matches and win chances appear here as soon as it is.
			</p>
		{:else}
			{@const shown = showPlayed ? mine : upcoming.length ? upcoming : mine}
			<ul class="divide-y divide-line">
				{#each shown as x (x.m.id)}
					{@const w = myWin(x)}
					{@const outcome = !x.m.played ? null : x.m.winner === 'tie' ? 'T' : x.m.winner === x.side ? 'W' : 'L'}
					<li>
						<a href="{eventPath}/matchup?match={x.m.id}" class="flex items-center gap-3 py-2.5 transition hover:opacity-80">
							<span class="w-12 shrink-0">
								<span class="block font-display text-lg leading-5">{x.m.label}</span>
								{#if !x.m.played && x.m.scheduledAt}<span class="text-[11px] text-muted">{clock(x.m.scheduledAt)}</span>{/if}
							</span>
							<span class="min-w-0 flex-1 text-sm">
								<span class="flex items-center gap-1.5">
									<span class="size-2 shrink-0 rounded-full {dot[x.side]}"></span>with <span class="font-medium">{others(x)}</span>
								</span>
								<span class="flex items-center gap-1.5 text-muted">
									<span class="size-2 shrink-0 rounded-full {dot[x.opp]}"></span>vs {x.m[x.opp].teams.map((t) => t.number).join(', ')}
								</span>
							</span>
							{#if outcome}
								<span class="text-right">
									<span class="rounded-full px-2 py-0.5 text-xs font-semibold {outcome === 'W' ? 'bg-live/15 text-live' : outcome === 'L' ? 'bg-red-al/15 text-red-al' : 'bg-line text-muted'}">{outcome}</span>
									{#if x.m[x.side].score && x.m[x.opp].score}
										<span class="mt-1 block text-xs text-muted">{x.m[x.side].score!.total}–{x.m[x.opp].score!.total}</span>
									{/if}
								</span>
							{:else if w !== null}
								<span class="flex w-24 shrink-0 flex-col items-end gap-1">
									<span class="text-sm font-semibold {w >= 0.5 ? 'text-accent' : 'text-muted'}">{pct(w)}</span>
									<span class="h-1.5 w-full overflow-hidden rounded-full bg-line" aria-hidden="true">
										<span class="block h-full rounded-full bg-accent" style:width="{w * 100}%"></span>
									</span>
								</span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
			{#if upcoming.length && upcoming.length < mine.length}
				<button type="button" class="mt-2 h-9 text-sm font-medium text-accent" onclick={() => (showPlayed = !showPlayed)}>
					{showPlayed ? 'Hide played matches' : `Show ${mine.length - upcoming.length} played`}
				</button>
			{/if}
		{/if}
	</section>
	</div>
{/if}
