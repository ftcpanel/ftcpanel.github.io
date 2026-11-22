<script lang="ts">
	let { pulse = true, class: cls = 'bg-live' }: { pulse?: boolean; class?: string } = $props();
</script>

<span class="relative inline-flex size-2 shrink-0" aria-hidden="true">
	{#if pulse}
		<span class="absolute inset-0 animate-ping rounded-full opacity-60 {cls}"></span>
	{/if}
	<span class="relative size-2 rounded-full {cls}"></span>
</span>
