<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let isLoading = false;

	async function handleSpotifyLogin() {
		isLoading = true;
		try {
			// Navigate to Spotify auth
			await goto('/auth/spotify');
		} catch (error) {
			console.error('Login failed:', error);
			isLoading = false;
		}
	}
</script>

<div class="mt-0 flex flex-col items-center justify-center md:min-h-[80vh]">
	<div class="logo mt-[2em] flex flex-col items-center justify-center">
		<h1 class="ss03 font-jak-display text-2xl font-bold text-primary lg:block lg:text-6xl">
			Sptfy.in
		</h1>
	</div>

	<Card.Root class="mt-6 w-[23rem] lg:w-[25rem]">
		<Card.Content class="grid gap-4 pb-6 pt-6">
			<h2 class="text-xl font-semibold">Sign in</h2>
			<Button class="w-full gap-2" onclick={handleSpotifyLogin} disabled={isLoading}>
				{#if isLoading}
					<Loader2 class="h-4 w-4 animate-spin" />
					Connecting to Spotify...
				{:else}
					Login with Spotify
				{/if}
			</Button>
			<p class="text-xs text-foreground/60">You'll be redirected to Spotify and then back here.</p>

			{#if import.meta.env.DEV}
				<div class="mt-4 rounded border border-orange-500/30 bg-orange-500/10 p-2 text-xs">
					<strong>Dev Info:</strong> PocketBase URL: {import.meta.env.VITE_POCKETBASE_URL ||
						'Not set'}
					<br />
					<a href="/debug-auth" class="text-blue-600 hover:underline">Debug Auth State</a>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
