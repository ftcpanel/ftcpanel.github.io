<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		value,
		size = 72,
		stroke = 7,
		color = 'var(--accent)',
		track = 'var(--line)',
		label,
		children
	}: {
		/** 0–1 */
		value: number;
		size?: number;
		stroke?: number;
		color?: string;
		track?: string;
		label: string;
		children?: Snippet;
	} = $props();

	const r = $derived((size - stroke) / 2);
	const c = $derived(2 * Math.PI * r);
</script>

<div class="relative inline-grid shrink-0 place-items-center" style:width="{size}px" style:height="{size}px" role="img" aria-label={label}>
	<svg width={size} height={size} class="-rotate-90">
		<circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={track} stroke-width={stroke} />
		<circle
			cx={size / 2}
			cy={size / 2}
			{r}
			fill="none"
			stroke={color}
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray={c}
			stroke-dashoffset={c * (1 - Math.min(1, Math.max(0, value)))}
			class="transition-[stroke-dashoffset] duration-700"
		/>
	</svg>
	{#if children}
		<div class="absolute inset-0 grid place-items-center">{@render children()}</div>
	{/if}
</div>
