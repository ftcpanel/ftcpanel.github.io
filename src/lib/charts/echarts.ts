// Only the chart types and components FTCPanel uses. This module is dynamically imported by
// Chart.svelte, so ECharts never lands in the initial bundle.
import { BarChart, LineChart } from 'echarts/charts';
import {
	GridComponent,
	LegendComponent,
	MarkLineComponent,
	TooltipComponent
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([
	BarChart,
	LineChart,
	GridComponent,
	LegendComponent,
	MarkLineComponent,
	TooltipComponent,
	SVGRenderer
]);

export { echarts };
