<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { resolve } from '$app/paths';
	import { Eye, EyeOff } from 'lucide-svelte';

	let { form } = $props();
	let showPassword = $state(false);
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
				<h2 class="text-xl font-semibold">Create an account</h2>
				<p class="text-sm text-foreground/60">Save your links and manage them later.</p>
			</div>

			{#if form?.message}
				<p class="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-foreground">
					{form.message}
				</p>
			{/if}

			<form method="POST" class="grid gap-3">
				<div class="grid gap-1.5">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						value={form?.email || ''}
						required
					/>
				</div>
				<div class="grid gap-1.5">
					<Label for="username">Username <span class="text-foreground/50">optional</span></Label>
					<Input
						id="username"
						name="username"
						autocomplete="username"
						value={form?.username || ''}
					/>
				</div>
				<div class="grid gap-1.5">
					<Label for="password">Password</Label>
					<div class="relative">
						<Input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							class="pr-10"
							required
						/>
						<button
							type="button"
							class="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
							aria-pressed={showPassword}
							onclick={() => (showPassword = !showPassword)}
						>
							{#if showPassword}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
				</div>
				<Button type="submit" class="w-full">Create account</Button>
			</form>

			<p class="border-t pt-4 text-center text-sm text-foreground/60">
				Already have an account?
				<a href={resolve('/@/login')} class="font-medium text-primary hover:underline">Sign in</a>
			</p>
		</Card.Content>
	</Card.Root>
</div>
