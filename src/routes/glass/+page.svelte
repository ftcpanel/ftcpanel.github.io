<script lang="ts">
	// Liquid-glass playground: a copy of the desktop rail over the page gradient + sample content,
	// with live sliders for every shader setting, like the library's demo site. It runs its own
	// glass root (the rail must be a direct child of it), so the app-wide glass ignores this region.
	import Icon from '#lib/components/Icon.svelte';
	import Logo from '#lib/components/Logo.svelte';
	import { GLASS_LOOK, RAIL_GLASS } from '#lib/glass/layer.ts';
	import type { GlassConfig, LiquidGlass } from '#lib/vendor/liquidglass.js';

	type Key = keyof Omit<GlassConfig, 'floating' | 'button'>;
	const params: { key: Key; label: string; min: number; max: number; step: number }[] = [
		{ key: 'blurAmount', label: 'Blur amount', min: 0, max: 1, step: 0.01 },
		{ key: 'refraction', label: 'Refraction', min: 0, max: 2, step: 0.01 },
		{ key: 'chromAberration', label: 'Chrom. aberration', min: 0, max: 0.3, step: 0.005 },
		{ key: 'edgeHighlight', label: 'Edge highlight', min: 0, max: 1, step: 0.01 },
		{ key: 'specular', label: 'Specular', min: 0, max: 1, step: 0.01 },
		{ key: 'fresnel', label: 'Fresnel', min: 0, max: 2, step: 0.01 },
		{ key: 'distortion', label: 'Distortion', min: 0, max: 1, step: 0.01 },
		{ key: 'cornerRadius', label: 'Corner radius', min: 0, max: 100, step: 1 },
		{ key: 'zRadius', label: 'Z-radius (bevel)', min: 1, max: 100, step: 1 },
		{ key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
		{ key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.01 },
		{ key: 'tintStrength', label: 'Tint', min: 0, max: 1, step: 0.01 },
		{ key: 'brightness', label: 'Brightness', min: -0.5, max: 0.5, step: 0.01 },
		{ key: 'shadowOpacity', label: 'Shadow opacity', min: 0, max: 1, step: 0.01 },
		{ key: 'shadowSpread', label: 'Shadow spread', min: 0, max: 40, step: 1 },
		{ key: 'shadowOffsetY', label: 'Shadow offset Y', min: -20, max: 20, step: 1 },
		{ key: 'bevelMode', label: 'Bevel mode (0 pill, 1 dome)', min: 0, max: 1, step: 1 }
	];

	/** Library defaults (README), with the site's rail settings on top. */
	const LIBRARY_DEFAULTS: Record<Key, number> = {
		blurAmount: 0,
		refraction: 0.69,
		chromAberration: 0.05,
		edgeHighlight: 0.05,
		specular: 0,
		fresnel: 1,
		distortion: 0,
		cornerRadius: 32,
		zRadius: 40,
		opacity: 1,
		saturation: 0,
		tintStrength: 0,
		brightness: 0,
		shadowOpacity: 0.3,
		shadowSpread: 10,
		shadowOffsetY: 1,
		bevelMode: 0
	};
	const SITE = { ...LIBRARY_DEFAULTS, ...GLASS_LOOK, ...RAIL_GLASS } as Record<Key, number>;

	let cfg = $state<Record<Key, number>>({ ...SITE });
	let draggable = $state(true);
	let fps = $state(0);
	let copied = $state(false);

	let root: HTMLDivElement;
	let rail: HTMLElement;

	const json = $derived(JSON.stringify(cfg, null, 2));

	// Push slider changes to the shader (the library re-reads data-config on change).
	$effect(() => {
		rail.dataset.config = JSON.stringify({ ...cfg, floating: draggable });
	});

	$effect(() => {
		let instance: LiquidGlass | null = null;
		let disposed = false;
		let timer: number | undefined;
		void (async () => {
			await document.fonts.ready;
			// Dynamic on purpose: WebGL + html-to-image only load on pages that render glass.
			const { LiquidGlass } = await import('#lib/vendor/liquidglass.js');
			const next = await LiquidGlass.init({ root, glassElements: [rail] });
			if (disposed) return next.destroy();
			instance = next;
			root.style.removeProperty('user-select');
			timer = window.setInterval(() => (fps = next.fps), 500);
		})();
		return () => {
			disposed = true;
			clearInterval(timer);
			instance?.destroy();
		};
	});

	function reset() {
		cfg = { ...SITE };
		rail.style.transform = '';
	}

	async function copy() {
		await navigator.clipboard.writeText(json);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}

	// Sample content for the glass to refract.
	const rows = [
		[1, 21062, 'QUANT', '6-0-0', 90.9],
		[2, 34350, 'OZGE', '6-0-0', 94.9],
		[3, 29029, 'FoxSlide', '5-1-0', 89.0],
		[4, 21094, 'SWB', '5-1-0', 75.0],
		[5, 28061, 'FIZMAT ROBOTICS', '5-1-0', 98.4],
		[6, 29162, 'xCellence', '5-1-0', 41.7]
	] as const;
</script>

<svelte:head><title>Glass playground · FTCPanel</title></svelte:head>

<div class="mx-auto max-w-screen-2xl px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 lg:px-10 lg:pt-10" data-glass-ignore>
	<header class="mb-6 text-white">
		<p class="text-white/75">Liquid glass · @ybouane/liquidglass</p>
		<h1 class="mt-1 font-display text-5xl">Glass playground</h1>
		<p class="mt-2 max-w-2xl text-white/80">
			The sidebar below uses the same WebGL glass as the site. Drag it over the content and tune it with the sliders.
		</p>
	</header>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
		<!-- Stage: its own glass root. Children = what the glass refracts + the rail. -->
		<div bind:this={root} class="squircle relative h-[44rem] overflow-hidden rounded-[2.5rem] [@supports(corner-shape:squircle)]:rounded-[3.5rem]">
			<div class="app-bg absolute inset-0"></div>

			<div class="absolute inset-0 p-8 pl-72 text-white">
				<p class="text-white/75">Qualifier · Nov 21 – Nov 22</p>
				<p class="mt-1 font-display text-5xl leading-tight">Astana FIRST Regional</p>
				<p class="mt-6 text-white/80">Average alliance score</p>
				<p class="font-display text-7xl leading-none">88.1<span class="ml-2 text-xl text-white/75">pts</span></p>
				<div class="card mt-8 max-w-xl p-2 text-ink">
					<p class="px-4 pt-3 pb-1 text-lg font-semibold">Rankings</p>
					<table class="w-full text-sm">
						<tbody>
							{#each rows as [rank, team, name, rec, opr] (team)}
								<tr class="{team === 34350 ? 'bg-accent-soft' : ''} [&>td:first-child]:rounded-l-2xl [&>td:last-child]:rounded-r-2xl">
									<td class="w-12 py-3 pl-4 font-display text-xl">{rank}</td>
									<td class="py-3"><span class="font-semibold">{team}</span> {name}</td>
									<td class="py-3 text-muted">{rec}</td>
									<td class="py-3 pr-4 text-right font-semibold">{opr}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="mt-6 flex h-3 max-w-xl gap-1">
					<span class="w-3/5 rounded-full bg-red-al"></span>
					<span class="flex-1 rounded-full bg-blue-al"></span>
				</div>
			</div>

			<!-- The rail (a copy of the site's), draggable when "Drag" is on. -->
			<aside bind:this={rail} class="absolute top-4 bottom-4 left-4 w-64 rounded-[2rem] text-white {draggable ? 'cursor-grab active:cursor-grabbing' : ''}">
				<div class="flex h-full flex-col gap-6 px-5 pt-7 pb-9">
					<div class="flex items-center gap-2.5 px-2">
						<Logo class="size-9" />
						<span class="text-lg font-semibold tracking-tight">FTC<span class="text-white/75">Panel</span></span>
					</div>
					<div class="mx-2 h-px bg-white/25"></div>
					<div class="flex flex-col gap-1">
						<span class="flex h-11 items-center gap-3 rounded-full px-4 text-sm font-medium text-white/85">
							<Icon name="team" class="size-[18px]" /> My Team
						</span>
						<span class="flex h-11 items-center gap-3 rounded-full bg-white px-4 text-sm font-medium text-[#16161d]">
							<Icon name="calendar" class="size-[18px]" /> Events
						</span>
					</div>
				</div>
			</aside>

			<span class="absolute right-4 bottom-4 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white tabular-nums">{fps} FPS</span>
		</div>

		<!-- Controls -->
		<section class="card self-start p-5" aria-label="Glass settings">
			<div class="mb-4 flex items-center justify-between gap-3">
				<h2 class="text-lg font-semibold tracking-tight">Settings</h2>
				<div class="flex gap-2">
					<button type="button" onclick={reset} class="h-9 rounded-full bg-surface-2 px-3 text-sm font-medium hover:bg-line">Reset</button>
					<button type="button" onclick={copy} class="h-9 rounded-full bg-ink px-3 text-sm font-medium text-bg">{copied ? 'Copied' : 'Copy JSON'}</button>
				</div>
			</div>

			<label class="mb-3 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-2.5 text-sm font-medium">
				Drag the sidebar
				<input type="checkbox" bind:checked={draggable} class="size-4 accent-accent" />
			</label>

			<div class="space-y-3">
				{#each params as p (p.key)}
					<label class="block">
						<span class="flex items-baseline justify-between text-sm">
							<span>{p.label}</span>
							<span class="font-mono text-xs text-muted tabular-nums">{cfg[p.key]}</span>
						</span>
						<input
							type="range"
							min={p.min}
							max={p.max}
							step={p.step}
							bind:value={cfg[p.key]}
							class="mt-1 h-6 w-full accent-accent"
						/>
					</label>
				{/each}
			</div>

			<pre class="mt-4 max-h-48 overflow-auto rounded-2xl bg-surface-2 p-3 text-xs">{json}</pre>
		</section>
	</div>
</div>
