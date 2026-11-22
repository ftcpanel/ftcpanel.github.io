// Liquid glass (WebGL refraction, vendored @ybouane/liquidglass) for every glass component, refracting
// the real page underneath it.
//
// How the library works: inside one root, it rasterizes the root's non-glass children (html-to-image)
// and renders each glass element (which must be a *direct child* of the root) by refracting whatever
// is painted below it. So the root layout makes one root holding:
//   - the page gradient (fixed),
//   - the page content wrapper (rasterized: this is what glass "reads"),
//   - fixed chrome that is glass itself (desktop rail, phone tab bar), registered with `direct`,
//   - a *mirror* for every in-page glass component (chips, back buttons, pickers…).
//
// Mirrors: in-page components live deep inside page layout, so each gets a live clone positioned
// over it as a direct child of the root, above the content. The original stays in place for layout,
// clicks and focus but is invisible (`data-glass-src`), so it is not in the content raster either,
// and the clone (pointer-events: none) shows it as real glass. The clone is re-synced whenever the
// original changes.
//
// Without WebGL, nothing is mirrored and components keep their CSS `glass` look.

import type { Attachment } from 'svelte/attachments';
import type { GlassConfig, LiquidGlass } from '#lib/vendor/liquidglass.js';

export interface GlassOptions {
	/** The element is itself a direct child of the glass root (fixed chrome); no mirror. */
	direct?: boolean;
	/** Per-element overrides of the shared look. */
	config?: Partial<GlassConfig>;
}

/** Shared look: lens-like bevel with visible refraction, rim light and a soft shadow. */
export const GLASS_LOOK: Partial<GlassConfig> = {
	blurAmount: 0.12,
	refraction: 1.05,
	chromAberration: 0.12,
	edgeHighlight: 0.12,
	specular: 0.3,
	fresnel: 1,
	saturation: 0.15,
	brightness: 0,
	shadowOpacity: 0.2,
	shadowSpread: 10,
	shadowOffsetY: 3
};

/** The desktop rail: a calmer, near-clear panel with a 44 px bevel. */
export const RAIL_GLASS: Partial<GlassConfig> = { zRadius: 44, blurAmount: 0.08 };

interface Entry {
	src: HTMLElement;
	/** The element the library renders: `src` itself (direct) or its mirror. */
	glass: HTMLElement;
	options: GlassOptions;
	/** Last applied geometry, to re-render only on change. */
	key: string;
	stop: () => void;
}

let root: HTMLElement | null = null;
let content: HTMLElement | null = null;
const entries = new Map<HTMLElement, Entry>();
let instance: LiquidGlass | null = null;
let token = 0;
let rebuildTimer: number | undefined;
let recaptureTimer: number | undefined;
let loop = 0;
/** scrollY of the last content capture; fixed glass only has a band around it captured in full. */
let capturedScroll = 0;
/** How far (in screens) fixed glass may scroll from the last capture before content is recaptured. */
const SCROLL_BAND = 0.5;
const supported = typeof document !== 'undefined' && !!document.createElement('canvas').getContext('webgl');
/** Liquid glass runs only in the glass theme (src/lib/stores/theme.svelte.ts). */
let enabled = supported && document.documentElement.dataset.theme === 'glass';
/** Every attached glass component, kept while glass is off so it can be switched on live. */
const sources = new Map<HTMLElement, GlassOptions>();

interface Zone {
	left: number;
	right: number;
	top: number;
	bottom: number;
}

/**
 * Where glass can see page content, in viewport coordinates. Mirrors sit on their originals and
 * scroll with the page, so only their own area (plus the refraction reach) matters. Fixed glass
 * (rail, tab bar) sees whatever scrolls under it: its column, SCROLL_BAND screens past it either
 * way (scrolling further triggers a recapture, see `position`).
 */
function glassZones(): Zone[] {
	const band = innerHeight * SCROLL_BAND + 60;
	const zones: Zone[] = [];
	for (const e of entries.values()) {
		const r = e.src.getBoundingClientRect();
		if (!r.width || !r.height) continue;
		zones.push(
			e.options.direct
				? { left: r.left - 16, right: r.right + 16, top: r.top - band, bottom: r.bottom + band }
				: { left: r.left - 60, right: r.right + 60, top: r.top - 60, bottom: r.bottom + 60 }
		);
	}
	return zones;
}

const hits = (zones: Zone[], r: Zone) =>
	zones.some((z) => r.left < z.right && r.right > z.left && r.top < z.bottom && r.bottom > z.top);

let captureZones: Zone[] = [];
let captureZonesAt = -Infinity;

/**
 * Capture pruning: an element no glass can see keeps its box in the raster but not its subtree
 * (html-to-image's per-node style copying is what makes capturing a long page slow). Elements
 * whose size depends on their content (inline, table parts) are never pruned.
 */
function prune(node: Node): boolean {
	// Only the app's own raster: the /glass playground runs a separate glass root.
	if (!(node instanceof HTMLElement) || !content?.contains(node) || node.closest('[data-glass-ignore]')) return false;
	const now = performance.now();
	if (now - captureZonesAt > 100) {
		captureZones = glassZones();
		captureZonesAt = now;
	}
	const r = node.getBoundingClientRect();
	if (!r.width || !r.height || hits(captureZones, r)) return false;
	const display = getComputedStyle(node).display;
	return display !== 'inline' && display !== 'contents' && !display.startsWith('table-') && !display.startsWith('ruby');
}

function recapture() {
	clearTimeout(recaptureTimer);
	recaptureTimer = window.setTimeout(() => {
		const run = () => {
			if (!instance || !content) return;
			capturedScroll = scrollY;
			captureZonesAt = -Infinity;
			void instance.capture.captureElement(content, true);
		};
		if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 600 });
		else run();
	}, 250);
}

/** Root layout: the glass root and the page-content wrapper inside it. */
export function mountGlass(rootEl: HTMLElement, contentEl: HTMLElement): () => void {
	root = rootEl;
	content = contentEl;
	for (const e of entries.values()) if (!e.options.direct) root.appendChild(e.glass);
	// Page content changed (live data, tabs, navigation): re-rasterize, but only when the change can
	// show through glass. Content below a change may shift, so the dirty area runs to the page end.
	const observer = new MutationObserver((mutations) => {
		const zones = glassZones();
		for (const m of mutations) {
			let el: Element | null = m.target instanceof Element ? m.target : m.target.parentElement;
			// Regions with their own glass root (the /glass playground) don't affect this raster.
			if (!el || el.closest('[data-glass-ignore]')) continue;
			// Just hidden or removed: measure the nearest ancestor that still has a box.
			while (el && el !== contentEl && el.getClientRects().length === 0) el = el.parentElement;
			const r = (el ?? contentEl).getBoundingClientRect();
			if (hits(zones, { left: r.left, right: r.right, top: r.top, bottom: Infinity })) return recapture();
		}
	});
	observer.observe(contentEl, { subtree: true, childList: true, characterData: true, attributes: true });
	const scheme = matchMedia('(prefers-color-scheme: dark)');
	scheme.addEventListener('change', schedule);
	startLoop();
	schedule();
	return () => {
		observer.disconnect();
		scheme.removeEventListener('change', schedule);
		instance?.destroy();
		instance = null;
		root = content = null;
	};
}

/** `{@attach glass()}`: makes an element styled with `glass` / `glass-panel` real liquid glass. */
export function glass(options: GlassOptions = {}): Attachment<HTMLElement> {
	return (src) => {
		if (!supported) return;
		sources.set(src, options);
		if (enabled) addEntry(src, options);
		return () => {
			sources.delete(src);
			entries.get(src)?.stop();
			if (entries.delete(src)) schedule();
		};
	};
}

function addEntry(src: HTMLElement, options: GlassOptions) {
	entries.set(src, options.direct ? directEntry(src, options) : mirrorEntry(src, options));
	startLoop();
	schedule();
}

/** Theme switch: tear down or bring up every glass component without a reload. */
export function setGlassEnabled(on: boolean) {
	on &&= supported;
	if (on === enabled) return;
	enabled = on;
	if (on) {
		for (const [src, options] of sources) addEntry(src, options);
	} else {
		for (const e of entries.values()) e.stop();
		entries.clear();
		schedule();
	}
}

function directEntry(src: HTMLElement, options: GlassOptions): Entry {
	return {
		src,
		glass: src,
		options,
		key: '',
		stop: () => delete src.dataset.liquid
	};
}

function mirrorEntry(src: HTMLElement, options: GlassOptions): Entry {
	const mirror = document.createElement(src.tagName);
	const sync = () => {
		const copy = src.cloneNode(true) as HTMLElement;
		// Form controls' live state doesn't clone (e.g. a <select>'s chosen option).
		const live = src.querySelectorAll<HTMLSelectElement | HTMLInputElement>('select, input');
		copy.querySelectorAll<HTMLSelectElement | HTMLInputElement>('select, input').forEach((c, i) => (c.value = live[i].value));
		mirror.replaceChildren(...copy.childNodes);
		mirror.className = `${src.className} glass-mirror`;
		// The mirror lives outside the original's ancestors, so carry over inherited text styles.
		const cs = getComputedStyle(src);
		for (const p of ['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'white-space'] as const) {
			mirror.style.setProperty(p, cs.getPropertyValue(p));
		}
		if (src.title) mirror.title = src.title;
		if (instance && entries.get(src)?.glass === mirror) mirror.dataset.liquid = '';
	};
	sync();
	mirror.setAttribute('aria-hidden', 'true');
	mirror.inert = true;
	src.dataset.glassSrc = '';
	root?.appendChild(mirror);

	const observer = new MutationObserver(sync);
	observer.observe(src, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'title', 'value'] });
	src.addEventListener('change', sync);
	src.addEventListener('input', sync);
	return {
		src,
		glass: mirror,
		options,
		key: '',
		stop: () => {
			observer.disconnect();
			src.removeEventListener('change', sync);
			src.removeEventListener('input', sync);
			delete src.dataset.glassSrc;
			mirror.remove();
		}
	};
}

/** Debounced rebuild: the library takes its glass list at init only. */
function schedule() {
	clearTimeout(rebuildTimer);
	rebuildTimer = window.setTimeout(() => void rebuild(), 150);
}

async function rebuild() {
	const t = ++token;
	instance?.destroy();
	instance = null;
	for (const e of entries.values()) delete e.glass.dataset.liquid;
	if (!enabled || !root || !content || entries.size === 0) return;

	position(true);
	const live = [...entries.values()].filter((e) => e.glass.offsetWidth > 0 && e.glass.offsetHeight > 0);
	for (const e of live) e.glass.dataset.config = JSON.stringify(configFor(e));
	try {
		// Webfonts must be loaded before capture so text in the raster matches the live DOM.
		await document.fonts.ready;
		// Dynamic on purpose: ~26 KB gz of WebGL + html-to-image, only fetched where WebGL exists.
		const { LiquidGlass, setCapturePrune } = await import('#lib/vendor/liquidglass.js');
		setCapturePrune(prune);
		const next = await LiquidGlass.init({ root, glassElements: live.map((e) => e.glass) });
		if (t !== token) return next.destroy();
		instance = next;
		// The library disables text selection on its root; the root is the whole app here.
		root.style.removeProperty('user-select');
		root.style.removeProperty('-webkit-user-select');
		for (const e of live) e.glass.dataset.liquid = '';
	} catch (err) {
		console.warn('Liquid glass unavailable, keeping CSS glass.', err);
	}
}

/** Keeps mirrors on top of their originals; re-renders glass that moved. */
function position(force = false) {
	if (!root) return;
	const rootRect = root.getBoundingClientRect();
	let appeared = false;
	for (const e of entries.values()) {
		const r = e.src.getBoundingClientRect();
		const shown = r.width > 0 && r.height > 0;
		const x = r.left - rootRect.left;
		const y = r.top - rootRect.top;
		const key = shown ? `${x.toFixed(1)},${y.toFixed(1)},${r.width.toFixed(1)},${r.height.toFixed(1)}` : 'hidden';
		if (!force && key === e.key) continue;
		// Glass that appeared or vanished (breakpoints, {#if}) changes the library's element list.
		if (!force && (key === 'hidden') !== (e.key === 'hidden' || e.key === '')) appeared = true;
		e.key = key;
		if (!e.options.direct && shown) {
			const s = e.glass.style;
			s.width = `${r.width}px`;
			s.height = `${r.height}px`;
			s.transform = `translate(${x}px, ${y}px)`;
		}
		// Direct (fixed) chrome moves relative to the root on scroll: what's under it changed.
		if (shown) instance?.markChanged(e.glass);
	}
	if (appeared) schedule();
	// Fixed glass only has a band around the last capture in full detail: recapture before leaving it.
	if (instance && Math.abs(scrollY - capturedScroll) > innerHeight * SCROLL_BAND * 0.6 && [...entries.values()].some((e) => e.options.direct && e.key !== 'hidden')) {
		capturedScroll = scrollY;
		recapture();
	}
}

function startLoop() {
	if (loop || typeof requestAnimationFrame === 'undefined') return;
	const tick = () => {
		position();
		loop = requestAnimationFrame(tick);
	};
	loop = requestAnimationFrame(tick);
}

function configFor(e: Entry): Partial<GlassConfig> {
	const w = e.glass.offsetWidth;
	const h = e.glass.offsetHeight;
	const radius = Math.min(parseFloat(getComputedStyle(e.src).borderTopLeftRadius) || 0, w / 2, h / 2);
	return {
		...GLASS_LOOK,
		cornerRadius: radius,
		// Pills (fully rounded ends) become full lenses, like the library's demo. Boxes with corners
		// keep the bevel to their corner radius, so text in their flat middle isn't smeared by the lens.
		zRadius: radius >= Math.min(w, h) / 2 - 1 ? Math.min(44, Math.max(12, Math.min(w, h) / 2)) : Math.max(12, Math.min(radius, 44)),
		...e.options.config
	};
}
