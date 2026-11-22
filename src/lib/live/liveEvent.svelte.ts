import { SvelteSet } from 'svelte/reactivity';
import { query, subscribe, watchWsConnection } from '#lib/api/client.ts';
import type { EventLiveQuery, EventType, MatchFieldsFragment } from '#lib/api/gql/graphql.ts';
import { EventLiveQuery as EventLiveDoc, NewMatchesSubscription } from '#lib/api/queries.ts';
import { place } from '#lib/format.ts';
import { buildPlayoffs, type Bracket, type FinalsSeries } from '#lib/model/bracket.ts';
import { fitEventModel, predictAll, predictMatchup, type EventModel, type MatchPrediction } from '#lib/model/matchup.ts';
import { liveStandings, teamRecords, type Standing } from '#lib/model/rankings.ts';
import { compareMatches, normalizeMatch, normalizeStats, seasonInfo } from '#lib/seasons/index.ts';
import type { ComponentValues, MatchRow, RankingRow } from '#lib/types.ts';

/**
 * - `live`: subscribed to `newMatches` and the socket is up.
 * - `polling`: event is ongoing but the socket is down; refetching every POLL_MS.
 * - `paused`: tab hidden (mobile browsers kill sockets in the background).
 * - `idle`: event is not ongoing; data is static.
 */
export type FeedStatus = 'loading' | 'live' | 'polling' | 'paused' | 'offline' | 'idle' | 'error';

/**
 * Refetch cadence while the socket is down. Note FTC Scout caches GraphQL responses per query text
 * for up to ~2 min (observed), so polling can lag; pushes don't.
 */
const POLL_MS = 20_000;
/** Safety refetch while live: OPR updates, score edits and schedule changes `newMatches` may not push. */
const SAFETY_MS = 60_000;
/** How long a newly posted match stays highlighted. */
const FRESH_MS = 12_000;
/** Keep a released feed alive briefly so moving between event and matchup pages doesn't refetch. */
const RELEASE_GRACE_MS = 15_000;

export interface EventInfo {
	season: number;
	code: string;
	name: string;
	type: EventType;
	start: string;
	end: string;
	started: boolean;
	ongoing: boolean;
	finished: boolean;
	venue: string | null;
	place: string;
	streamUrl: string | null;
}

type EventData = NonNullable<EventLiveQuery['eventByCode']>;

/** FTC Scout's team rows: names, locations, and stats (OPR) that may lag behind pushed matches. */
function toTeamRows(teams: EventData['teams']): RankingRow[] {
	return teams.map((t) => ({
		team: t.teamNumber,
		name: t.team.name,
		location: place(t.team.location),
		stats: normalizeStats(t.stats)
	}));
}

/**
 * Rankings = FTC Scout's official stats, extended with pushed results they don't include yet
 * (rank, RS, record, averages, RP rates). OPR always comes from FTC Scout.
 */
function mergeRankings(rows: RankingRow[], matches: MatchRow[], season: number): RankingRow[] {
	const info = seasonInfo(season);
	const official = new Map<number, Standing>();
	for (const r of rows) {
		if (r.stats) official.set(r.team, { ...r.stats, tb: [r.stats.tb1, r.stats.tb2] });
	}
	const standings = liveStandings(teamRecords(matches, info), official, info);
	const noOpr = Object.fromEntries(info.components.map((c) => [c.key, NaN]));
	return rows
		.map((r) => {
			const s = standings.get(r.team);
			if (!s) return r;
			const { tb, ...rest } = s;
			return {
				...r,
				stats: {
					...rest,
					tb1: tb[0] ?? NaN,
					tb2: tb[1] ?? NaN,
					oprNp: r.stats?.oprNp ?? NaN,
					opr: r.stats?.opr ?? noOpr,
					avg: r.stats?.avg ?? noOpr
				}
			};
		})
		.sort((a, b) => (a.stats?.rank ?? Infinity) - (b.stats?.rank ?? Infinity) || a.team - b.team);
}

function toPriors(preview: EventData['previewStats']): Map<number, ComponentValues> {
	const priors = new Map<number, ComponentValues>();
	for (const p of preview ?? []) {
		const stats = normalizeStats(p.stats);
		if (stats && stats.played > 0) priors.set(p.teamNumber, stats.opr);
	}
	return priors;
}

export class LiveEvent {
	info = $state.raw<EventInfo | null>(null);
	matches = $state.raw<MatchRow[]>([]);
	#teamRows = $state.raw<RankingRow[]>([]);
	/** Rankings; move the moment a pushed result arrives (see mergeRankings). */
	rankings: RankingRow[] = $derived.by(() =>
		mergeRankings(this.#teamRows, this.matches, this.season)
	);
	status = $state<FeedStatus>('loading');
	/** Epoch ms of the last data received from FTC Scout. */
	updatedAt = $state<number | null>(null);
	error = $state<string | null>(null);
	notFound = $state(false);
	/** Match ids posted since the page opened, highlighted for FRESH_MS. */
	fresh = new SvelteSet<number>();
	/** Per-team prior strengths (stats from an earlier event), from FTC Scout `previewStats`. */
	priors = $state.raw(new Map<number, ComponentValues>());
	/** Matchup model, refit in the browser whenever matches change (milliseconds). */
	model: EventModel = $derived.by(() =>
		fitEventModel(
			this.matches,
			this.#teamRows.map((r) => r.team),
			this.priors,
			seasonInfo(this.season).components.map((c) => c.key)
		)
	);
	/** Playoff bracket (or finals series), projected and simulated with the matchup model. */
	playoffs: Bracket | FinalsSeries | null = $derived.by(() =>
		buildPlayoffs(this.matches, this.#teamRows.length, (red, blue) =>
			predictMatchup(this.model, red.teams.slice(0, 2), blue.teams.slice(0, 2)).pRed
		)
	);
	/**
	 * Pre-match predictions for every match: played ones use only the matches before them (honest
	 * hit/miss), upcoming ones the current model.
	 */
	predictions: Map<number, MatchPrediction> = $derived.by(() =>
		predictAll(this.matches, this.#teamRows.map((r) => r.team), this.priors, seasonInfo(this.season).components.map((c) => c.key), this.model)
	);

	#wsUp = false;
	#unsubscribe: (() => void) | null = null;
	#unwatchWs: (() => void) | null = null;
	#timer: number | undefined;
	#inflight: AbortController | null = null;
	#stopped = false;

	constructor(
		readonly season: number,
		readonly code: string
	) {}

	start(): () => void {
		document.addEventListener('visibilitychange', this.#resume);
		window.addEventListener('online', this.#resume);
		window.addEventListener('offline', this.#sync);
		void this.refresh().then(this.#sync);
		return () => this.#stop();
	}

	#loadRetries = 0;

	/** Refetches the whole event (matches + rankings). One request, ~2–3 KB gzipped. */
	async refresh(): Promise<void> {
		if (this.#inflight || this.#stopped) return;
		const ac = new AbortController();
		this.#inflight = ac;
		try {
			const data = await query(EventLiveDoc, { season: this.season, code: this.code }, ac.signal);
			if (!data.eventByCode) {
				this.notFound = true;
				this.status = 'error';
				return;
			}
			const wasOngoing = this.info?.ongoing;
			const first = !this.info;
			this.#apply(data.eventByCode);
			this.error = null;
			this.updatedAt = Date.now();
			this.#loadRetries = 0;
			if (first) this.#sync();
			else if (wasOngoing !== this.info?.ongoing) this.#sync();
		} catch (err) {
			if (ac.signal.aborted) return;
			this.error = err instanceof Error ? err.message : String(err);
			if (!this.info) {
				// Nothing to show yet and no live timers running: retry with backoff (2 s → 30 s).
				this.status = 'error';
				const delay = Math.min(30_000, 2_000 * 2 ** this.#loadRetries++);
				window.setTimeout(() => void this.refresh(), delay);
			}
		} finally {
			this.#inflight = null;
		}
	}

	#apply(ev: EventData) {
		this.info = {
			season: ev.season,
			code: ev.code,
			name: ev.name,
			type: ev.type,
			start: ev.start,
			end: ev.end,
			started: ev.started,
			ongoing: ev.ongoing,
			finished: ev.finished,
			venue: ev.location.venue,
			place: place(ev.location),
			streamUrl: ev.liveStreamURL ?? ev.webcasts[0] ?? null
		};
		this.#teamRows = toTeamRows(ev.teams);
		this.priors = toPriors(ev.previewStats);
		this.#setMatches(ev.matches);
	}

	/**
	 * `merge`: add/replace (pushes). Otherwise the incoming list is the full schedule (refetch), but
	 * FTC Scout's GraphQL responses are cached for up to ~2 min while pushes are immediate, so a
	 * refetch must never roll back a result we already have from a push.
	 */
	#setMatches(incoming: MatchFieldsFragment[], merge = false) {
		const hadData = this.matches.length > 0 || this.updatedAt !== null;
		const prev = new Map(this.matches.map((m) => [m.id, m]));
		const next = merge ? new Map(prev) : new Map<number, MatchRow>();
		for (const raw of incoming) {
			const m = normalizeMatch(raw);
			const old = prev.get(m.id);
			if (!merge && old?.played && (!m.played || (old.postedAt ?? '') > (m.postedAt ?? ''))) {
				next.set(m.id, old);
				continue;
			}
			if (hadData && m.played && !old?.played) this.#markFresh(m.id);
			next.set(m.id, m);
		}
		if (!merge) {
			// Results pushed after the cached response was generated.
			for (const old of prev.values()) if (old.played && !next.has(old.id)) next.set(old.id, old);
		}
		this.matches = [...next.values()].sort(compareMatches);
	}

	#markFresh(id: number) {
		this.fresh.add(id);
		setTimeout(() => this.fresh.delete(id), FRESH_MS);
	}

	#onPush = (data: { newMatches: MatchFieldsFragment[] | null }) => {
		if (!data.newMatches?.length) return;
		// Rankings and the matchup model are derived from `matches`, so they update in this tick.
		this.#setMatches(data.newMatches, true);
		this.updatedAt = Date.now();
	};

	#resume = () => {
		if (document.visibilityState === 'visible' && navigator.onLine) {
			void this.refresh().then(this.#sync);
		} else {
			this.#sync();
		}
	};

	/** Brings subscription, timers and status in line with event state, visibility and network. */
	#sync = () => {
		const info = this.info;
		if (this.#stopped || !info) return;
		const visible = document.visibilityState === 'visible';
		const online = navigator.onLine;
		const wantLive = info.ongoing && visible && online;

		if (wantLive && !this.#unsubscribe) {
			this.#unsubscribe = subscribe(
				NewMatchesSubscription,
				{ season: this.season, code: this.code },
				{ next: this.#onPush, error: (err) => (this.error = String(err)) }
			);
			this.#unwatchWs = watchWsConnection((up) => {
				const reconnected = up && !this.#wsUp && this.updatedAt !== null;
				this.#wsUp = up;
				// Catch up on anything posted while the socket was down.
				if (reconnected && Date.now() - this.updatedAt! > 5_000) void this.refresh();
				this.#sync();
			});
			return;
		}
		if (!wantLive) this.#teardownLive();

		this.status = !info.ongoing
			? 'idle'
			: !online
				? 'offline'
				: !visible
					? 'paused'
					: this.#wsUp
						? 'live'
						: 'polling';
		this.#schedule();
	};

	#schedule() {
		clearTimeout(this.#timer);
		if (!this.#unsubscribe) return;
		this.#timer = window.setTimeout(
			() => void this.refresh().then(() => this.#schedule()),
			this.#wsUp ? SAFETY_MS : POLL_MS
		);
	}

	#teardownLive() {
		this.#unsubscribe?.();
		this.#unwatchWs?.();
		this.#unsubscribe = this.#unwatchWs = null;
		this.#wsUp = false;
		clearTimeout(this.#timer);
	}

	#stop() {
		this.#stopped = true;
		this.#teardownLive();
		this.#inflight?.abort();
		document.removeEventListener('visibilitychange', this.#resume);
		window.removeEventListener('online', this.#resume);
		window.removeEventListener('offline', this.#sync);
	}
}

interface FeedEntry {
	feed: LiveEvent;
	refs: number;
	stop: () => void;
	idleTimer?: number;
}

const feeds = new Map<string, FeedEntry>();

/**
 * One live feed (one subscription, one poller) per event per tab, shared by every page showing it.
 * Call `release` on unmount; the feed stops RELEASE_GRACE_MS after its last release.
 */
export function acquireLiveEvent(
	season: number,
	code: string
): { feed: LiveEvent; release: () => void } {
	const key = `${season}:${code}`;
	let entry = feeds.get(key);
	if (!entry) {
		const feed = new LiveEvent(season, code);
		entry = { feed, refs: 0, stop: feed.start() };
		feeds.set(key, entry);
	}
	clearTimeout(entry.idleTimer);
	entry.refs++;
	const e = entry;
	let released = false;
	return {
		feed: e.feed,
		release: () => {
			if (released) return;
			released = true;
			if (--e.refs > 0) return;
			e.idleTimer = window.setTimeout(() => {
				e.stop();
				feeds.delete(key);
			}, RELEASE_GRACE_MS);
		}
	};
}
