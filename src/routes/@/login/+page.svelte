<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Loader2 } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';

	let { form } = $props();
	let loadingProvider = $state('');

	function handleOAuthLogin(provider) {
		loadingProvider = provider;
		if (browser) {
			window.location.href = resolve(`/@/auth/${provider}`);
		} else {
			loadingProvider = '';
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
		<Card.Content class="grid gap-5 pb-6 pt-6">
			<div class="space-y-1">
				<h2 class="text-xl font-semibold">Sign in</h2>
				<p class="text-sm text-foreground/60">Use OAuth or continue with email.</p>
			</div>

			{#if form?.message}
				<p class="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
					{form.message}
				</p>
			{/if}

			<div class="grid gap-2">
				<Button
					class="w-full gap-2"
					onclick={() => handleOAuthLogin('google')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'google'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Connecting to Google...
					{:else}
						Continue with Google
					{/if}
				</Button>
				<Button
					class="w-full gap-2"
					variant="secondary"
					onclick={() => handleOAuthLogin('discord')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'discord'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Connecting to Discord...
					{:else}
						Continue with Discord
					{/if}
				</Button>
			</div>

			<div class="relative text-center text-xs text-foreground/50">
				<span class="bg-card px-2">or</span>
			</div>

			<form method="POST" action="?/login" class="grid gap-3">
				<div class="grid gap-1.5">
					<Label for="login-email">Email</Label>
					<Input id="login-email" name="email" type="email" autocomplete="email" required />
				</div>
				<div class="grid gap-1.5">
					<Label for="login-password">Password</Label>
					<Input
						id="login-password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
					/>
				</div>
				<Button type="submit" class="w-full">Log in</Button>
			</form>

			<form method="POST" action="?/signup" class="grid gap-3 border-t pt-4">
				<h3 class="text-sm font-medium">Create an account</h3>
				<div class="grid gap-1.5">
					<Label for="signup-email">Email</Label>
					<Input id="signup-email" name="email" type="email" autocomplete="email" required />
				</div>
				<div class="grid gap-1.5">
					<Label for="signup-username"
						>Username <span class="text-foreground/50">optional</span></Label
					>
					<Input id="signup-username" name="username" autocomplete="username" />
				</div>
				<div class="grid gap-1.5">
					<Label for="signup-password">Password</Label>
					<Input
						id="signup-password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
					/>
				</div>
				<Button type="submit" class="w-full" variant="secondary">Sign up</Button>
			</form>

			<details class="rounded border border-border/70 p-3 text-xs text-foreground/60">
				<summary class="cursor-pointer">More sign-in options</summary>
				<Button
					class="mt-3 w-full gap-2"
					variant="ghost"
					onclick={() => handleOAuthLogin('spotify')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'spotify'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Connecting to Spotify...
					{:else}
						Continue with Spotify (optional)
					{/if}
				</Button>
			</details>

			{#if import.meta.env.DEV}
				<div class="mt-4 rounded border border-orange-500/30 bg-orange-500/10 p-2 text-xs">
					<strong>Dev Info:</strong> PocketBase URL: {import.meta.env.VITE_POCKETBASE_URL ||
						'Not set'}
					<br />
					<a href={resolve('/@/debug-auth')} class="text-blue-600 hover:underline"
						>Debug Auth State</a
					>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
