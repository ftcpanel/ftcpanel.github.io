<script lang="ts">
	import { record } from '#lib/format.ts';
	import { slotColor, type Meetings } from '#lib/model/compare.ts';
	import { CURRENT_SEASON } from '#lib/seasons/index.ts';
	import type { AllianceColor } from '#lib/types.ts';
	import Icon from './Icon.svelte';

	let {
		pairs,
		slots,
		eventNames,
		pending,
		teamCount
	}: {
		pairs: Meetings[];
		/** Team number → comparison slot (series color). */
		slots: Map<number, number>;
		eventNames: Map<string, string>;
		pending: boolean;
		teamCount: number;
	} = $props();

	const sideText: Record<AllianceColor, string> = { red: 'text-red-al', blue: 'text-blue-al' };
	/** Matches listed per pair before "Show all". */
	const SHOWN = 5;
	let expanded = $state<Record<string, boolean>>({});
</script>

{#snippet dot(team: number)}
	<span class="inline-block size-2.5 shrink-0 rounded-full" style:background={slotColor(slots.get(team) ?? 0)}></span>
{/snippet}

<section class="card p-5 sm:p-6" aria-label="Head to head">
	<h2 class="text-lg font-semibold tracking-tight">Head to head</h2>
	<p class="mb-4 text-sm text-muted">Matches this season where {teamCount > 2 ? 'any two of these teams' : 'these teams'} shared the field</p>

	{#if pending}
		<div class="h-32 animate-pulse rounded-2xl bg-surface-2"></div>
	{:else if pairs.length === 0}
		<p class="rounded-2xl bg-surface-2 p-6 text-center text-sm text-muted">These teams haven't met this season.</p>
	{:else}
		<div class="grid grid-cols-1 gap-x-8 gap-y-6 {pairs.length > 1 ? 'xl:grid-cols-2' : ''}">
			{#each pairs as pair (`${pair.a}-${pair.b}`)}
				{@const key = `${pair.a}-${pair.b}`}
				{@const newest = [...pair.matches].reverse()}
				<div class="min-w-0">
					<h3 class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
						<span class="flex items-center gap-1.5">{@render dot(pair.a)}{pair.a}</span>
						<span class="text-sm font-normal text-muted">&amp;</span>
						<span class="flex items-center gap-1.5">{@render dot(pair.b)}{pair.b}</span>
						<span class="text-sm font-normal text-muted">· {pair.matches.length} {pair.matches.length === 1 ? 'match' : 'matches'}</span>
					</h3>
					<div class="grid grid-cols-2 gap-2.5">
						<div class="rounded-2xl bg-surface-2 p-4">
							<p class="text-xs text-muted">With each other</p>
							<p class="mt-1 font-display text-3xl leading-none">{record(pair.together)}</p>
							<p class="mt-1 text-xs text-muted">W-L-T on the same alliance</p>
						</div>
						<div class="rounded-2xl bg-surface-2 p-4">
							<p class="text-xs text-muted">Against each other</p>
							<p class="mt-1 font-display text-3xl leading-none">
								{pair.against.aWins}-{pair.against.bWins}{#if pair.against.ties}-{pair.against.ties}{/if}
							</p>
							<p class="mt-1 text-xs text-muted">
								{pair.a} wins – {pair.b} wins{#if pair.against.ties} – ties{/if}
							</p>
						</div>
					</div>

					<ul class="mt-2.5 divide-y divide-line" aria-label="Matches, newest first">
						{#each expanded[key] ? newest : newest.slice(0, SHOWN) as m (`${m.eventCode}:${m.match.id}`)}
							{@const together = m.aSide === m.bSide}
							{@const red = m.match.red.score?.total}
							{@const blue = m.match.blue.score?.total}
							<li>
								<a
									href="/events/{CURRENT_SEASON}/{m.eventCode}/matchup?match={m.match.id}"
									class="-mx-2 flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-surface-2"
								>
									<span class="w-16 shrink-0">
										<span class="block font-display text-lg leading-6">{m.match.label}</span>
										<span class="block truncate text-xs text-muted" title={eventNames.get(m.eventCode)}>{m.eventCode}</span>
									</span>
									<span class="min-w-0 flex-1 text-sm">
										{#if together}
											<span class="block">
												<span class="font-semibold {sideText[m.aSide]}">{pair.a} + {pair.b}</span>
											</span>
											<span class="block text-xs text-muted">Same alliance</span>
										{:else}
											<span class="block">
												<span class="font-semibold {sideText[m.aSide]}">{pair.a}</span>
												<span class="text-muted">vs</span>
												<span class="font-semibold {sideText[m.bSide]}">{pair.b}</span>
											</span>
											<span class="block text-xs text-muted">Opponents</span>
										{/if}
									</span>
									<span class="shrink-0 text-right">
										{#if red != null && blue != null}
											<span class="block text-sm tabular-nums">
												<span class="text-red-al {m.match.winner === 'red' ? 'font-semibold' : ''}">{red}</span>
												<span class="text-muted">–</span>
												<span class="text-blue-al {m.match.winner === 'blue' ? 'font-semibold' : ''}">{blue}</span>
											</span>
											<span class="block text-xs font-medium">
												{#if m.match.winner === 'tie'}
													<span class="text-muted">Tie</span>
												{:else if together}
													<span class={m.match.winner === m.aSide ? 'text-live' : 'text-warn'}>{m.match.winner === m.aSide ? 'Won' : 'Lost'}</span>
												{:else}
													<span class="text-muted">{m.match.winner === m.aSide ? pair.a : pair.b} won</span>
												{/if}
											</span>
										{:else}
											<span class="text-xs text-muted">Not played</span>
										{/if}
									</span>
									<Icon name="chevron" class="size-4 shrink-0 -rotate-90 text-muted" />
								</a>
							</li>
						{/each}
					</ul>
					{#if newest.length > SHOWN}
						<button type="button" class="mt-1 h-10 text-sm font-medium text-accent" onclick={() => (expanded[key] = !expanded[key])}>
							{expanded[key] ? 'Show fewer' : `Show all ${newest.length} matches`}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>
