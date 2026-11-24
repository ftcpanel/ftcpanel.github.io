<script lang="ts">
	import type { EventSummaryFragment } from '#lib/api/gql/graphql.ts';
	import { eventType, place } from '#lib/format.ts';
	import Icon from './Icon.svelte';
	import LiveDot from './LiveDot.svelte';
	import type { Snippet } from 'svelte';

	let { event, children }: { event: EventSummaryFragment; children?: Snippet } = $props();

	const start = $derived(new Date(`${event.start}T00:00:00Z`));
	const month = $derived(start.toLocaleString(undefined, { month: 'short', timeZone: 'UTC' }));
	const day = $derived(start.getUTCDate());
	const days = $derived(
		Math.round((Date.parse(`${event.end}T00:00:00Z`) - start.getTime()) / 86_400_000) + 1
	);
</script>

<a
	href="/events/{event.season}/{event.code}"
	class="card group flex min-h-20 items-center gap-4 p-3 pr-4 transition hover:-translate-y-0.5 active:scale-[0.99]"
>
	<div
		class="grid w-14 shrink-0 place-items-center rounded-[1.1rem] py-2 {event.ongoing
			? 'bg-accent text-white'
			: 'bg-surface-2'}"
	>
		<span class="text-xs {event.ongoing ? 'text-white/80' : 'text-muted'}">{month}</span>
		<span class="font-display text-2xl leading-7">{day}</span>
		{#if days > 1}<span class="text-[11px] opacity-60">{days} days</span>{/if}
	</div>
	<div class="min-w-0 flex-1">
		<p class="flex items-center gap-1.5 text-xs text-muted">
			{#if event.ongoing}<LiveDot /><span class="font-medium text-live">Live</span> ·{/if}
			{eventType(event.type)}
		</p>
		<p class="mt-0.5 line-clamp-2 font-medium wrap-anywhere lg:line-clamp-1">{event.name}</p>
		<p class="line-clamp-2 text-sm text-muted wrap-anywhere lg:line-clamp-1">{event.remote ? 'Remote' : place(event.location)}</p>
		{@render children?.()}
	</div>
	<span class="grid size-9 shrink-0 place-items-center self-start rounded-full bg-surface-2 text-muted transition group-hover:bg-ink group-hover:text-bg">
		<Icon name="arrow-up-right" class="size-4" />
	</span>
</a>
