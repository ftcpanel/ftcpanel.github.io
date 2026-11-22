<script lang="ts">
	let { class: cls = 'size-8' }: { class?: string } = $props();
</script>

<!--
	Friendly robot "panel": outlined head, one plain eye and one red/blue win-probability pie eye.
	Colors follow the theme tokens, so the mark inverts cleanly in dark mode.
	Static copy: src/lib/assets/favicon.svg.
-->
<svg class={cls} viewBox="0 0 40 40" aria-hidden="true">
	<rect x="1.5" y="7.5" width="37" height="25" rx="6.5" fill="var(--bg)" stroke="var(--ink)" stroke-width="2.6" />
	<circle cx="12.5" cy="20" r="4.6" fill="var(--ink)" />
	<g fill="none" stroke-width="3" transform="rotate(-90 27.5 20)">
		<circle cx="27.5" cy="20" r="3.2" stroke="var(--red-al)" stroke-dasharray="11.4 100" />
		<circle cx="27.5" cy="20" r="3.2" stroke="var(--blue-al)" stroke-dasharray="7.3 100" stroke-dashoffset="-12.1" />
	</g>
</svg>
