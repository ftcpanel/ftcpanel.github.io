<script lang="ts">
	import type { EChartsCoreOption, EChartsType } from 'echarts/core';
	import { chartTheme, type ChartTheme } from './theme.ts';

	let {
		option,
		height = 240,
		label
	}: {
		/** Built from the current theme; re-run when the OS color scheme flips. */
		option: (theme: ChartTheme) => EChartsCoreOption;
		height?: number;
		/** Accessible description of what the chart shows. */
		label: string;
	} = $props();

	let el: HTMLDivElement;
	let chart = $state.raw<EChartsType | null>(null);
	let theme = $state.raw<ChartTheme | null>(null);

	$effect(() => {
		let disposed = false;
		let ro: ResizeObserver | undefined;
		const scheme = matchMedia('(prefers-color-scheme: dark)');
		const onScheme = () => (theme = chartTheme());
		scheme.addEventListener('change', onScheme);
		void import('./echarts.ts').then(({ echarts }) => {
			if (disposed) return;
			theme = chartTheme();
			chart = echarts.init(el, null, { renderer: 'svg' });
			ro = new ResizeObserver(() => chart?.resize());
			ro.observe(el);
		});
		return () => {
			disposed = true;
			scheme.removeEventListener('change', onScheme);
			ro?.disconnect();
			chart?.dispose();
			chart = null;
		};
	});

	$effect(() => {
		if (chart && theme) chart.setOption(option(theme), { notMerge: true });
	});
</script>

<div bind:this={el} role="img" aria-label={label} style:height="{height}px" class="w-full"></div>
