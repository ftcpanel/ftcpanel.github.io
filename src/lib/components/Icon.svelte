<script lang="ts" module>
	// Lucide-style 24×24 stroke paths; inline to avoid an icon dependency.
	const paths = {
		team: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
		calendar: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
		search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
		external: 'M14 3h7v7M10 14 21 3M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5',
		chevron: 'M6 9l6 6 6-6',
		back: 'M15 18l-6-6 6-6',
		close: 'M18 6 6 18M6 6l12 12',
		refresh: 'M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6',
		arrow: 'M5 12h14M13 6l6 6-6 6',
		'arrow-up-right': 'M7 17 17 7M8 7h9v9',
		swap: 'M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
		pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
		play: 'M7 4v16l13-8z'
	} as const;
	export type IconName = keyof typeof paths;
</script>

<script lang="ts">
	let { name, class: cls = 'size-5' }: { name: IconName; class?: string } = $props();
</script>

<svg
	class={cls}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<path d={paths[name]} />
</svg>
