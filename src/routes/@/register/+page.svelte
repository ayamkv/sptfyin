<script>
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { resolve } from '$app/paths';

	let { form } = $props();
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
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						required
					/>
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
