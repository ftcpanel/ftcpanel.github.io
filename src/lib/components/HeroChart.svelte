<script lang="ts">
	// White line chart drawn straight on the page gradient (no card): faint vertical grid, soft area
	// glow, x-axis labels, and one highlighted point with a drop line and a glass note pill.
	// Plain SVG + HTML overlays, so header charts never load ECharts.
	import { glass } from '#lib/glass/layer.ts';

	let {
		values,
		labels = [],
		height = 150,
		highlight = values.length - 1,
		note,
		label
	}: {
		values: number[];
		/** One x-axis label per value; a readable subset is shown. */
		labels?: string[];
		height?: number;
		/** Index of the highlighted point (default: latest). */
		highlight?: number;
		/** Text for the pill above the highlighted point. */
		note?: string;
		/** Accessible description. */
		label: string;
	} = $props();

	const id = $props.id();
	const W = 100;
	/** Room above the line for the note pill, and below for the dot overhang. */
	const TOP = 44;
	const BOTTOM = 8;

	const points = $derived.by(() => {
		if (values.length < 2) return [];
		const min = Math.min(...values);
		const max = Math.max(...values);
		const span = max - min || 1;
		return values.map((v, i) => ({
			x: (i / (values.length - 1)) * W,
			y: TOP + (1 - (v - min) / span) * (height - TOP - BOTTOM)
		}));
	});

	/** Catmull-Rom → cubic Bézier, control points clamped to the plot so peaks don't overshoot. */
	const line = $derived.by(() => {
		const p = points;
		if (p.length < 2) return '';
		const clampY = (y: number) => Math.min(height - BOTTOM, Math.max(TOP, y));
		let d = `M${p[0].x},${p[0].y}`;
		for (let i = 0; i < p.length - 1; i++) {
			const p0 = p[i - 1] ?? p[i];
			const p1 = p[i];
			const p2 = p[i + 1];
			const p3 = p[i + 2] ?? p2;
			const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: clampY(p1.y + (p2.y - p0.y) / 6) };
			const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: clampY(p2.y - (p3.y - p1.y) / 6) };
			d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
		}
		return d;
	});

	const hi = $derived(points[Math.min(Math.max(0, highlight), points.length - 1)]);
	/** Up to 6 evenly spaced ticks, always including the first, the last and the highlighted point. */
	const ticks = $derived.by(() => {
		const n = values.length;
		if (n < 2) return [];
		const count = Math.min(n, 6);
		const idx = new Set(Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / (count - 1))));
		idx.add(highlight);
		return [...idx].sort((a, b) => a - b).map((i) => ({ i, x: (i / (n - 1)) * W, text: labels[i] ?? '' }));
	});
	/** Keep the note pill inside the chart near the edges. */
	const pillShift = $derived(!hi ? '-50%' : hi.x > 82 ? '-100%' : hi.x < 18 ? '0%' : '-50%');
</script>

{#if points.length >= 2 && hi}
	<figure class="w-full" aria-label={label}>
		<div class="relative w-full" style:height="{height}px">
			<!-- Faint vertical grid at the ticks -->
			{#each ticks as t (t.i)}
				<span class="absolute inset-y-0 w-px bg-on-bg/12" style:left="{t.x}%"></span>
			{/each}

			<svg viewBox="0 0 {W} {height}" preserveAspectRatio="none" class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
				<defs>
					<linearGradient id="fill-{id}" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" style:stop-color="var(--hero-ink)" stop-opacity="0.32" />
						<stop offset="100%" style:stop-color="var(--hero-ink)" stop-opacity="0" />
					</linearGradient>
				</defs>
				<path d="{line} L{W},{height} L0,{height} Z" fill="url(#fill-{id})" />
				<path d={line} fill="none" style:stroke="var(--hero-ink)" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round" />
				<line x1={hi.x} x2={hi.x} y1={hi.y} y2={height} style:stroke="var(--hero-ink)" stroke-opacity="0.55" stroke-dasharray="3 4" vector-effect="non-scaling-stroke" />
			</svg>

			<!-- Highlighted point -->
			<span
				class="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-hero-ink shadow-[0_0_0_5px_color-mix(in_srgb,var(--hero-ink)_28%,transparent),0_0_18px_4px_color-mix(in_srgb,var(--hero-ink)_45%,transparent)]"
				style:left="{hi.x}%"
				style:top="{hi.y}px"
			></span>
			{#if note}
				<span
					{@attach glass()}
					class="glass absolute rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap text-on-bg"
					style:left="{hi.x}%"
					style:top="{Math.max(0, hi.y - 40)}px"
					style:translate="{pillShift} 0"
				>
					{note}
				</span>
			{/if}
		</div>

		{#if labels.length}
			<!-- X axis -->
			<div class="relative mt-2 h-8 text-[11px]" aria-hidden="true">
				{#each ticks as t (t.i)}
					{@const active = t.i === highlight}
					{@const edge = t.x > 92 ? '-100%' : t.x < 8 ? '0%' : '-50%'}
					<span class="absolute top-0 flex flex-col items-center gap-1 whitespace-nowrap {active ? 'font-semibold text-on-bg' : 'text-on-bg/60'}" style:left="{t.x}%" style:translate="{edge} 0">
						<span class="size-1 rounded-full {active ? 'bg-on-bg' : 'bg-transparent'}"></span>
						{t.text}
					</span>
				{/each}
			</div>
		{/if}
	</figure>
{/if}
