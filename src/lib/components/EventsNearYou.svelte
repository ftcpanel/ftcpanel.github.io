<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { query } from '#lib/api/client.ts';
	import { MyTeamQuery, SeasonEventsQuery } from '#lib/api/queries.ts';
	import { stateName } from '#lib/search/events.ts';
	import { CURRENT_SEASON } from '#lib/seasons/index.ts';
	import { myTeam } from '#lib/stores/myTeam.svelte.ts';
	import EventCard from './EventCard.svelte';
	import Icon from './Icon.svelte';

	/**
	 * Events in one area (country, optionally a state/province), from the season's event list.
	 * Default area: the last one picked here, else my team's, else the browser's country.
	 */

	const KEY = 'ftcpanel:near';
	interface Area {
		country: string;
		/** Empty = the whole country. */
		state: string;
	}

	const all = createQuery(() => ({
		queryKey: ['seasonEvents', CURRENT_SEASON],
		queryFn: ({ signal }) => query(SeasonEventsQuery, { season: CURRENT_SEASON }, signal),
		staleTime: 30 * 60_000
	}));
	const team = createQuery(() => ({
		queryKey: ['team', myTeam.current?.number, CURRENT_SEASON],
		queryFn: ({ signal }) => query(MyTeamQuery, { number: myTeam.current!.number, season: CURRENT_SEASON }, signal),
		enabled: myTeam.current !== null
	}));

	const events = $derived(all.data?.eventsSearch ?? []);
	const countries = $derived([...new Set(events.map((e) => e.location.country))].sort((a, b) => a.localeCompare(b)));

	function saved(): Area | null {
		try {
			const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			return typeof v?.country === 'string' && typeof v?.state === 'string' ? v : null;
		} catch {
			return null;
		}
	}

	/** Browser locale's country, in FTC Scout's naming ("US" → "USA"). */
	function browserCountry(): string | null {
		try {
			const region = new Intl.Locale(navigator.language).maximize().region;
			if (!region) return null;
			if (region === 'US') return 'USA';
			return new Intl.DisplayNames(['en'], { type: 'region' }).of(region) ?? null;
		} catch {
			return null;
		}
	}

	let picked = $state<Area | null>(saved());
	const area = $derived.by<Area | null>(() => {
		if (picked) return picked;
		const loc = team.data?.teamByNumber?.location;
		if (loc && countries.includes(loc.country)) {
			// Team's state/province if it has events still to come, else its whole country.
			const soon = events.some((e) => !e.finished && e.location.country === loc.country && e.location.state === loc.state);
			return { country: loc.country, state: soon ? loc.state : '' };
		}
		const c = browserCountry();
		return c && countries.includes(c) ? { country: c, state: '' } : null;
	});

	function pick(next: Area) {
		picked = next;
		localStorage.setItem(KEY, JSON.stringify(next));
	}

	/** States/provinces with events in the chosen country, labelled with a full name or a city. */
	const states = $derived.by(() => {
		if (!area) return [];
		const cities = new Map<string, Map<string, number>>();
		for (const e of events) {
			if (e.location.country !== area.country || !e.location.state) continue;
			const m = cities.get(e.location.state) ?? new Map<string, number>();
			m.set(e.location.city, (m.get(e.location.city) ?? 0) + 1);
			cities.set(e.location.state, m);
		}
		return [...cities]
			.map(([code, m]) => {
				const city = [...m].sort((a, b) => b[1] - a[1])[0][0];
				return { code, label: stateName(area.country, code) ?? `${code} · ${city}` };
			})
			.sort((a, b) => a.label.localeCompare(b.label));
	});

	const inArea = $derived(
		area ? events.filter((e) => e.location.country === area.country && (!area.state || e.location.state === area.state)) : []
	);
	const coming = $derived(
		inArea.filter((e) => !e.finished).sort((a, b) => Number(b.ongoing) - Number(a.ongoing) || a.start.localeCompare(b.start))
	);
	const past = $derived(inArea.filter((e) => e.finished).sort((a, b) => b.start.localeCompare(a.start)));
	const PREVIEW = 6;
	let showAll = $state(false);
	let showPast = $state(false);

	const select =
		'h-11 min-w-0 appearance-none rounded-full bg-surface pr-9 pl-4 text-sm font-medium shadow-[var(--card-shadow)] outline-none focus:ring-2 focus:ring-accent';
</script>

<section class="mb-10" aria-labelledby="near-h">
	<div class="mb-3 flex flex-wrap items-end justify-between gap-3">
		<div class="text-on-bg">
			<h2 id="near-h" class="flex items-center gap-2 text-lg font-semibold tracking-tight">
				<Icon name="pin" class="size-5" /> Near you
			</h2>
			<p class="text-sm text-on-bg/75">
				{#if area}
					{coming.length ? `${coming.length} coming up` : 'Nothing coming up'}{past.length ? ` · ${past.length} earlier this season` : ''}
				{:else}
					Pick your country to see events there.
				{/if}
			</p>
		</div>
		<div class="flex min-w-0 flex-wrap gap-2">
			<label class="relative">
				<span class="sr-only">Country</span>
				<select
					class="{select} max-w-52"
					value={area?.country ?? ''}
					onchange={(e) => pick({ country: e.currentTarget.value, state: '' })}
					disabled={!countries.length}
				>
					{#if !area}<option value="" disabled>Country</option>{/if}
					{#each countries as c (c)}<option value={c}>{c}</option>{/each}
				</select>
				<Icon name="chevron" class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
			</label>
			{#if area && states.length > 1}
				<label class="relative">
					<span class="sr-only">State or region</span>
					<select class="{select} max-w-56" value={area.state} onchange={(e) => pick({ country: area.country, state: e.currentTarget.value })}>
						<option value="">All of {area.country}</option>
						{#each states as s (s.code)}<option value={s.code}>{s.label}</option>{/each}
					</select>
					<Icon name="chevron" class="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
				</label>
			{/if}
		</div>
	</div>

	{#if all.isPending}
		<div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
			{#each { length: 3 } as _, i (i)}<div class="h-20 animate-pulse rounded-3xl bg-surface-2"></div>{/each}
		</div>
	{:else if all.isError}
		<p class="card p-5 text-sm text-red-al">Couldn't load events: {all.error.message}</p>
	{:else if area}
		<div class="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
			{#each showAll ? coming : coming.slice(0, PREVIEW) as event (event.code)}
				<EventCard {event} />
			{:else}
				<p class="card p-5 text-sm text-muted md:col-span-2 xl:col-span-3">No more events this season in this area.</p>
			{/each}
		</div>
		<div class="mt-3 flex flex-wrap gap-x-5">
			{#if !showAll && coming.length > PREVIEW}
				<button type="button" class="h-10 text-sm font-medium text-accent" onclick={() => (showAll = true)}>
					Show all {coming.length} coming up
				</button>
			{/if}
			{#if past.length}
				<button type="button" class="h-10 text-sm font-medium text-accent" onclick={() => (showPast = !showPast)}>
					{showPast ? 'Hide' : 'Show'} {past.length} earlier this season
				</button>
			{/if}
		</div>
		{#if showPast}
			<div class="mt-2 grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
				{#each past as event (event.code)}<EventCard {event} />{/each}
			</div>
		{/if}
	{/if}
</section>
