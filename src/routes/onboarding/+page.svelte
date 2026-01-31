<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { goto } from '$app/navigation';

	export let data;
	let username = data.initial || '';
	let initial = data.initial || '';
	let errorMsg = '';

	async function save() {
		errorMsg = '';
		const res = await fetch('/api/me', {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username })
		});
		if (!res.ok) {
			const text = await res.text();
			errorMsg = text || 'failed';
			return;
		}
		console.log('[Onboarding] Username saved');
		document.cookie = 'pb_onboarding=; Max-Age=0; path=/';
		goto('/dash/links');
	}

	async function confirm() {
		await save();
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
			<h2 class="text-xl font-semibold">Pick a username</h2>
			<Input bind:value={username} placeholder="yourname" minlength="3" maxlength="150" />
			{#if initial}
				<p class="text-xs text-foreground/60">
					We prefilled your current username from OAuth: <b>{initial}</b>
				</p>
			{/if}
			{#if errorMsg}
				<p class="text-xs text-red-400">{errorMsg}</p>
			{/if}
			<Button class="w-full" on:click={save}>Save</Button>
			<Button class="w-full" on:click={confirm} variant="secondary">Keep current username</Button>
		</Card.Content>
	</Card.Root>
</div>
