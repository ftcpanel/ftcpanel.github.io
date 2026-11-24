<script lang="ts">
	import { pct } from '#lib/format.ts';
	import type { Alliance, Bracket, BracketSlot, Color, FinalsSeries, SlotSide } from '#lib/model/bracket.ts';
	import Icon from './Icon.svelte';

	let {
		playoffs,
		highlight = null,
		eventPath
	}: {
		playoffs: Bracket | FinalsSeries;
		/** My team: its alliance is highlighted. */
		highlight?: number | null;
		eventPath: string;
	} = $props();

	const mine = (a: Alliance | null) => !!a && highlight !== null && a.teams.includes(highlight);
	const dot: Record<Color, string> = { red: 'bg-red-al', blue: 'bg-blue-al' };
	const text: Record<Color, string> = { red: 'text-red-al', blue: 'text-blue-al' };

	/** Upper and lower bracket columns, plus the final(s). */
	const layout = $derived.by(() => {
		if (playoffs.kind !== 'double-elim') return null;
		const cols = (side: 'upper' | 'lower') => {
			const slots = playoffs.slots.filter((s) => s.def.side === side);
			const n = Math.max(0, ...slots.map((s) => s.def.column)) + 1;
			return Array.from({ length: n }, (_, c) => slots.filter((s) => s.def.column === c));
		};
		const final = playoffs.slots.filter((s) => s.def.side === 'final');
		/** Consecutive slots sharing a round name, for the stacked phone layout. */
		const rounds = (slots: BracketSlot[]) =>
			slots.reduce<{ name: string; slots: BracketSlot[] }[]>((acc, s) => {
				const last = acc.at(-1);
				if (last?.name === s.def.round) last.slots.push(s);
				else acc.push({ name: s.def.round, slots: [s] });
				return acc;
			}, []);
		const upper = cols('upper');
		const lower = cols('lower');
		return {
			upper,
			lower,
			final,
			sections: [
				{ label: 'Upper bracket', rounds: rounds(upper.flat()) },
				{ label: 'Lower bracket', rounds: rounds(lower.flat()) },
				{ label: 'Final', rounds: rounds(final) }
			]
		};
	});

	function href(slot: BracketSlot): string | undefined {
		if (slot.match) return `${eventPath}/matchup?match=${slot.match.id}`;
		const r = slot.red.alliance;
		const b = slot.blue.alliance;
		if (!r || !b) return undefined;
		return `${eventPath}/matchup?red=${r.teams.slice(0, 2).join(',')}&blue=${b.teams.slice(0, 2).join(',')}`;
	}
</script>

{#snippet allianceLabel(a: Alliance)}
	<span class="grid size-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">{a.seed || '–'}</span>
	<span class="min-w-0 text-sm sm:truncate">
		<span class="font-semibold">{a.captain}</span>
		{#each a.teams.slice(1) as t (t)}<span class="text-muted"> · {t}</span>{/each}
	</span>
{/snippet}

{#snippet sideRow(slot: BracketSlot, color: Color, side: SlotSide)}
	{@const won = slot.winner === color}
	{@const lost = slot.winner !== null && !won}
	{@const p = slot.pRed === null ? null : color === 'red' ? slot.pRed : 1 - slot.pRed}
	<div
		class="flex min-h-10 items-center gap-2 rounded-2xl px-2.5 py-1 sm:h-10 sm:py-0 {mine(side.alliance) ? 'bg-accent-soft' : ''} {side.projected ? 'outline-1 outline-line outline-dashed' : ''}"
	>
		<span class="size-2 shrink-0 rounded-full {dot[color]}" aria-hidden="true"></span>
		{#if side.alliance}
			<span class="flex min-w-0 flex-1 items-center gap-2 {lost ? 'opacity-50' : ''} {side.projected ? 'italic' : ''}">
				{@render allianceLabel(side.alliance)}
			</span>
		{:else}
			<span class="flex-1 truncate text-xs text-muted">{side.from}</span>
		{/if}
		{#if side.score !== null}
			<span class="font-display text-xl leading-none {won ? text[color] : 'text-muted'}">{side.score}</span>
		{:else if p !== null}
			<span class="text-xs {p >= 0.5 ? `font-semibold ${text[color]}` : 'text-muted'}" title="Win probability">{pct(p)}</span>
		{/if}
	</div>
{/snippet}

{#snippet slotCard(slot: BracketSlot)}
	{@const link = slot.skipped ? undefined : href(slot)}
	<svelte:element
		this={link ? 'a' : 'div'}
		href={link}
		class="block rounded-3xl bg-surface-2 p-2 transition {slot.skipped ? 'opacity-40' : link ? 'hover:-translate-y-0.5 hover:shadow-[var(--card-shadow)]' : ''}"
	>
		<p class="flex items-baseline justify-between px-2 pt-0.5 pb-1.5 text-[11px]">
			<span class="font-semibold">M{slot.def.series}</span>
			<!-- The stacked layout below md already heads each round. -->
			<span class="truncate text-muted {slot.skipped ? '' : 'max-md:hidden'}">{slot.skipped ? 'Not needed' : slot.def.round}</span>
		</p>
		<div class="space-y-1">
			{@render sideRow(slot, 'red', slot.red)}
			{@render sideRow(slot, 'blue', slot.blue)}
		</div>
		{#if slot.pRed !== null && !slot.winner}
			<div class="mx-2 mt-2 flex h-1 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
				<span class="rounded-full bg-red-al" style:width="{slot.pRed * 100}%"></span>
				<span class="flex-1 rounded-full bg-blue-al"></span>
			</div>
		{/if}
	</svelte:element>
{/snippet}

{#snippet oddsList(odds: { alliance: Alliance; p: number }[], champion: Alliance | null)}
	{#if champion}
		<div class="flex items-center gap-3 rounded-2xl px-3 py-2.5 {mine(champion) ? 'bg-accent-soft' : 'bg-surface-2'}">
			<span class="flex min-w-0 flex-1 items-center gap-2">{@render allianceLabel(champion)}</span>
			<span class="rounded-full bg-live/15 px-2.5 py-0.5 text-xs font-semibold text-live">Champions</span>
		</div>
	{:else}
		<ul class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
			{#each odds as o (o.alliance.captain)}
				<li class="flex items-center gap-3 rounded-2xl px-3 py-2 {mine(o.alliance) ? 'bg-accent-soft' : 'bg-surface-2'}">
					<span class="flex min-w-0 flex-1 items-center gap-2">{@render allianceLabel(o.alliance)}</span>
					<span class="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-line">
						<span class="block h-full rounded-full bg-accent" style:width="{o.p * 100}%"></span>
					</span>
					<span class="w-10 text-right text-sm font-semibold tabular-nums">{pct(o.p)}</span>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#if playoffs.kind === 'double-elim' && layout}
	<section class="card min-w-0 p-4 sm:p-5" aria-label="Playoff bracket">
		<div class="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-1">
			<h2 class="text-lg font-semibold tracking-tight">Bracket</h2>
			<p class="text-xs text-muted">{playoffs.template.alliances} alliances · double elimination · dashed = projected · tap a match for the matchup</p>
		</div>

		<div class="mb-4">
			<p class="mb-2 px-1 text-xs font-semibold text-muted">
				{playoffs.champion ? 'Champions' : 'Title chances · simulated over the rest of the bracket, updated with every result'}
			</p>
			{@render oddsList(playoffs.odds, playoffs.champion)}
		</div>

		<!-- Phones and small tablets: sections stacked, each round's matches one under another. -->
		<div class="space-y-5 md:hidden">
			{#each layout.sections as section (section.label)}
				<div>
					<h3 class="mb-2 px-1 text-sm font-semibold">{section.label}</h3>
					<div class="space-y-3">
						{#each section.rounds as round (round.name)}
							<div>
								<p class="mb-1.5 px-2 text-xs font-semibold text-muted">{round.name}</p>
								<div class="grid gap-3 sm:grid-cols-2">
									{#each round.slots as slot (slot.def.series)}{@render slotCard(slot)}{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<!-- From md up: columns fill the width on desktop; narrower screens scroll sideways through the rounds. -->
		<div class="-mx-4 hidden overflow-x-auto px-4 pb-2 sm:-mx-5 sm:px-5 md:block">
			<div
				class="grid gap-x-3 gap-y-5"
				style:grid-template-columns="repeat({layout.upper.length + 1}, minmax(14rem, 1fr))"
			>
				{#each layout.upper as col, c (c)}
					<div class="flex flex-col justify-around gap-3" style:grid-row="1" style:grid-column={c + 1}>
						{#if c === 0}<p class="-mb-1 px-2 text-xs font-semibold text-muted">Upper bracket</p>{/if}
						{#each col as slot (slot.def.series)}{@render slotCard(slot)}{/each}
					</div>
				{/each}
				{#each layout.lower as col, c (c)}
					<div class="flex flex-col justify-around gap-3" style:grid-row="2" style:grid-column={c + 1 + (layout.upper.length - layout.lower.length)}>
						{#if c === 0}<p class="-mb-1 px-2 text-xs font-semibold text-muted">Lower bracket</p>{/if}
						{#each col as slot (slot.def.series)}{@render slotCard(slot)}{/each}
					</div>
				{/each}
				<div class="flex flex-col justify-center gap-3" style:grid-row="1 / span 2" style:grid-column={layout.upper.length + 1}>
					<p class="-mb-1 px-2 text-xs font-semibold text-muted">Final</p>
					{#each layout.final as slot (slot.def.series)}{@render slotCard(slot)}{/each}
				</div>
			</div>
		</div>
	</section>
{:else if playoffs.kind === 'finals'}
	{@const series = playoffs}
	<section class="card p-4 sm:p-5" aria-label="Finals">
		<div class="mb-3 flex items-baseline justify-between gap-3 px-1">
			<h2 class="text-lg font-semibold tracking-tight">Finals</h2>
			<p class="text-xs text-muted">Best of 3</p>
		</div>
		<div class="space-y-4">
			<div class="space-y-2">
				{#each [['red', series.red], ['blue', series.blue]] as const as [color, a] (color)}
					<div class="flex items-center gap-3 rounded-2xl px-3 py-2.5 {mine(a) ? 'bg-accent-soft' : 'bg-surface-2'}">
						<span class="size-2.5 rounded-full {dot[color]}"></span>
						<span class="flex min-w-0 flex-1 items-center gap-2">{@render allianceLabel(a)}</span>
						<span class="font-display text-3xl leading-none {text[color]}">{series.wins[color]}</span>
					</div>
				{/each}
				<div class="flex flex-wrap gap-2 px-1 pt-1">
					{#each series.matches as m (m.id)}
						<a href="{eventPath}/matchup?match={m.id}" class="rounded-full bg-surface-2 px-3 py-1 text-xs hover:bg-line">
							{m.label}
							{#if m.red.score && m.blue.score}
								· <span class={m.winner === 'red' ? 'font-semibold text-red-al' : ''}>{m.red.score.total}</span>–<span class={m.winner === 'blue' ? 'font-semibold text-blue-al' : ''}>{m.blue.score.total}</span>
							{:else}
								<Icon name="arrow-up-right" class="inline size-3" />
							{/if}
						</a>
					{/each}
				</div>
			</div>
			<div>
				<p class="mb-2 px-1 text-xs font-semibold text-muted">{series.champion ? 'Champions' : 'Title chances'}</p>
				{@render oddsList(series.odds, series.champion)}
			</div>
		</div>
	</section>
{/if}
