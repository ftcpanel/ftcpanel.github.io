<script lang="ts" generics="T extends string">
	let {
		value = $bindable(),
		options,
		class: cls = ''
	}: {
		value: T;
		options: { value: T; label: string; badge?: string | number | null }[];
		class?: string;
	} = $props();
</script>

<div class="flex gap-1 rounded-full bg-surface p-1 shadow-[var(--card-shadow)] {cls}" role="tablist">
	{#each options as o (o.value)}
		{@const active = value === o.value}
		<button
			type="button"
			role="tab"
			aria-selected={active}
			onclick={() => (value = o.value)}
			class="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition {active
				? 'bg-ink text-bg'
				: 'text-muted hover:text-ink'}"
		>
			{o.label}
			{#if o.badge != null && o.badge !== ''}
				<span class="text-xs {active ? 'opacity-70' : 'text-muted'}">{o.badge}</span>
			{/if}
		</button>
	{/each}
</div>
