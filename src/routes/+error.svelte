<script>
	import { page } from '$app/state';
	// fetch from https://http.cat/status/ and
</script>

<div class="flex min-h-screen flex-col items-center justify-center text-center align-middle">
	<h1 class="m-2 font-jak-display text-4xl text-primary">{page.status}</h1>
	<img
		src="https://http.cat/{page.status}"
		alt="Error Cat {page.status}"
		class="m-4 rounded-sm"
		width="600"
		height="400"
	/>
	<p class="text-lg">{@html page.error.message}</p>
</div>
