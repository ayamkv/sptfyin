<script>
	let { src, href, alt = 'Tenor GIF', title = alt, aspectRatio = '1' } = $props();
</script>

<figure
	class="rd-squircle rd-shadow-inset overflow-hidden rounded-3xl border border-border bg-rd-chip"
>
	<a href={href || src} target="_blank" rel="noreferrer" class="block no-underline">
		<img
			{src}
			{alt}
			{title}
			loading="lazy"
			decoding="async"
			style={`aspect-ratio: ${aspectRatio};`}
			class="block w-full object-cover"
		/>
	</a>
</figure>
