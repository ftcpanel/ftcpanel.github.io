export interface ChartTheme {
	ink: string;
	muted: string;
	line: string;
	surface: string;
	red: string;
	blue: string;
	accent: string;
	/** Scoring component colors, in season component order. */
	comps: string[];
}

/** Reads the current design tokens so charts match the OS light/dark scheme. */
export function chartTheme(): ChartTheme {
	const css = getComputedStyle(document.documentElement);
	const v = (name: string) => css.getPropertyValue(name).trim();
	return {
		ink: v('--ink'),
		muted: v('--muted'),
		line: v('--line'),
		surface: v('--surface'),
		red: v('--red-al'),
		blue: v('--blue-al'),
		accent: v('--accent'),
		comps: [v('--comp-1'), v('--comp-2'), v('--comp-3')]
	};
}

const SANS = "'Geist Variable', ui-sans-serif, system-ui, sans-serif";

/** Shared base options: soft tooltips confined to the chart, tap-friendly. */
export function baseOption(t: ChartTheme) {
	return {
		animationDuration: 400,
		animationEasing: 'cubicOut' as const,
		textStyle: { color: t.muted, fontFamily: SANS, fontSize: 12 },
		tooltip: {
			confine: true,
			backgroundColor: t.surface,
			borderWidth: 0,
			padding: [8, 12],
			extraCssText: 'border-radius:14px;box-shadow:0 12px 32px -12px rgba(0,0,0,.35);',
			textStyle: { color: t.ink, fontSize: 13, fontFamily: SANS }
		}
	};
}

/** Value-axis styling: no axis line, faint dashed grid. */
export function axisStyle(t: ChartTheme) {
	return {
		axisLine: { show: false },
		axisTick: { show: false },
		axisLabel: { color: t.muted, fontFamily: SANS, fontSize: 12 },
		splitLine: { lineStyle: { color: t.line, type: [4, 4] as number[] } }
	};
}
