import { createClient, type Client } from 'graphql-ws';
import type { TypedDocumentString } from './gql/graphql.ts';

// GraphQL is the only FTC Scout API used by the client: it is served with `Cache-Control: no-store`,
// whereas the REST API sits behind a 120 s CDN cache.
export const GRAPHQL_HTTP = 'https://api.ftcscout.org/graphql';
export const GRAPHQL_WS = 'wss://api.ftcscout.org/graphql';

export class ApiError extends Error {}

export async function query<R, V>(
	doc: TypedDocumentString<R, V>,
	variables: V,
	signal?: AbortSignal
): Promise<R> {
	const res = await fetch(GRAPHQL_HTTP, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ query: doc.toString(), variables }),
		signal
	});
	if (!res.ok) throw new ApiError(`FTC Scout returned HTTP ${res.status}`);
	const body = (await res.json()) as { data?: R; errors?: { message: string }[] };
	if (body.errors?.length) throw new ApiError(body.errors[0].message);
	if (!body.data) throw new ApiError('FTC Scout returned no data');
	return body.data;
}

let ws: Client | null = null;
let wsConnected = false;
const wsWatchers = new Set<(connected: boolean) => void>();

function setWsConnected(connected: boolean) {
	wsConnected = connected;
	for (const watcher of wsWatchers) watcher(connected);
}

/** Calls `watcher` now and whenever the shared socket connects or closes. */
export function watchWsConnection(watcher: (connected: boolean) => void): () => void {
	wsWatchers.add(watcher);
	watcher(wsConnected);
	return () => wsWatchers.delete(watcher);
}

/** One shared WebSocket per tab; graphql-ws multiplexes every subscription over it. */
export function wsClient(): Client {
	ws ??= createClient({
		url: GRAPHQL_WS,
		lazy: true,
		lazyCloseTimeout: 3_000,
		keepAlive: 20_000,
		retryAttempts: Infinity,
		shouldRetry: () => true,
		on: {
			connected: () => setWsConnected(true),
			closed: () => setWsConnected(false)
		},
		retryWait: (retries) => {
			const { promise, resolve } = Promise.withResolvers<void>();
			setTimeout(resolve, Math.min(30_000, 1_000 * 2 ** retries) + Math.random() * 1_000);
			return promise;
		}
	});
	return ws;
}

export interface SubscriptionSink<R> {
	next(data: R): void;
	error(err: unknown): void;
}

export function subscribe<R, V>(
	doc: TypedDocumentString<R, V>,
	variables: V,
	sink: SubscriptionSink<R>
): () => void {
	return wsClient().subscribe<R>(
		{ query: doc.toString(), variables: variables as Record<string, unknown> },
		{
			next: (result) => {
				if (result.errors?.length) sink.error(new ApiError(result.errors[0].message));
				else if (result.data) sink.next(result.data);
			},
			error: sink.error,
			complete: () => {}
		}
	);
}
