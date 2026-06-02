<script>
	import DonoWebglShader from '$lib/components/shaders/dono-webgl-shader.svelte';

	let { interactive = true } = $props();
</script>

<div class="absolute inset-0 overflow-hidden" aria-hidden="true">
	<DonoWebglShader {interactive} />
</div>
