<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ArrowRight, Loader2 } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import 'iconify-icon';

	let { form } = $props();
	let loadingProvider = $state('');
	let popupWindow = $state(null);

	function handleOAuthLogin(provider) {
		loadingProvider = provider;
		if (!browser) {
			loadingProvider = '';
			return;
		}

		const authUrl = resolve(`/@/auth/${provider}?popup=1`);
		popupWindow = window.open(authUrl, 'sptfyin-oauth', 'popup,width=520,height=720');
		if (!popupWindow) {
			window.location.href = resolve(`/@/auth/${provider}`);
			return;
		}

		popupWindow.focus();
	}

	onMount(() => {
		function handleOAuthMessage(event) {
			if (event.origin !== window.location.origin) return;
			if (event.data?.type !== 'sptfyin:oauth-success') return;

			window.location.href = resolve(event.data.destination || '/@/dash/links');
		}

		const closeCheck = window.setInterval(() => {
			if (popupWindow?.closed) {
				loadingProvider = '';
				popupWindow = null;
			}
		}, 500);

		window.addEventListener('message', handleOAuthMessage);
		return () => {
			window.removeEventListener('message', handleOAuthMessage);
			window.clearInterval(closeCheck);
		};
	});
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
				<p class="text-sm text-foreground/60">Use Google, Discord, or your email.</p>
			</div>

			{#if form?.message}
				<p class="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
					{form.message}
				</p>
			{/if}

			<div class="grid gap-2">
				<Button
					class="relative w-full justify-start gap-3 border border-[#dadce0] bg-white pl-4 text-[#1f1f1f] transition-all duration-150 hover:scale-[1.01] hover:bg-[#f8fafd] hover:shadow-md active:scale-[0.99] active:shadow-sm"
					variant="outline"
					onclick={() => handleOAuthLogin('google')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'google'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Connecting to Google...
					{:else}
						<iconify-icon icon="logos:google-icon" width="18" class="h-[18px] w-[18px]"
						></iconify-icon>
						Continue with Google
						<ArrowRight class="ml-auto h-4 w-4 text-[#5f6368]" />
					{/if}
				</Button>
				<Button
					class="relative w-full justify-start gap-3 bg-[#5865F2] pl-4 text-white transition-all duration-150 hover:scale-[1.01] hover:bg-[#4752c4] hover:shadow-md active:scale-[0.99] active:shadow-sm"
					onclick={() => handleOAuthLogin('discord')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'discord'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Connecting to Discord...
					{:else}
						<iconify-icon
							icon="simple-icons:discord"
							width="18"
							class="h-[18px] w-[18px] text-white"
						></iconify-icon>
						Continue with Discord
						<ArrowRight class="ml-auto h-4 w-4 text-white/70" />
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

			<p class="border-t pt-4 text-center text-sm text-foreground/60">
				New here?
				<a href={resolve('/@/register')} class="font-medium text-primary hover:underline"
					>Create an account</a
				>
			</p>

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
