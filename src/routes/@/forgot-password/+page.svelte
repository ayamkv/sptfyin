<script>
	import { resolve } from '$app/paths';
	import 'iconify-icon';

	let { form } = $props();
</script>

<div class="min-h-[calc(100vh-8rem)] bg-card px-4 py-8 text-foreground">
	<div class="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-[25rem] flex-col justify-center">
		<header class="relative mx-auto mb-8 h-20 w-full max-w-[21rem]">
			<a
				data-auth-flip
				data-flip-id="auth-logo"
				href={resolve('/')}
				class="ss03 absolute left-1/2 top-0 -translate-x-1/2 rounded-none font-jak-display text-5xl font-black leading-none text-primary no-underline outline-none hover:text-primary hover:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
			>
				sptfy.in
			</a>
			<div
				data-auth-flip
				data-flip-id="auth-chip"
				class="rd-squircle rd-shadow-lift absolute left-1/2 top-14 flex h-6 min-w-[8.75rem] -translate-x-1/2 rotate-[-2deg] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-rd-yellow px-3 text-xs font-semibold text-rd-on-accent"
			>
				<iconify-icon icon="lucide:mail" width="13"></iconify-icon>
				<span class="shrink-0">reset password</span>
			</div>
		</header>

		<section
			data-auth-flip
			data-flip-id="auth-panel"
			class="rd-squircle rd-shadow-panel rounded-2xl border border-border bg-card p-4"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h1
						data-auth-flip
						data-flip-id="auth-title"
						class="font-jak-display text-2xl font-black leading-none text-foreground"
					>
						forgot password?
					</h1>
					<p class="mt-1 text-xs text-rd-muted">we'll send a reset link if the email exists</p>
				</div>
				<a
					data-auth-flip
					data-flip-id="auth-switch"
					href={resolve('/@/login')}
					class="rounded-xl bg-background/25 px-3 py-2 text-xs font-semibold text-primary no-underline hover:text-primary hover:outline-none focus-visible:ring-2 focus-visible:ring-primary"
				>
					login
				</a>
			</div>

			<form data-auth-flip method="POST" class="grid gap-3">
				<div class="grid gap-1.5">
					<label for="email" class="pl-1 text-xs text-foreground">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						value={form?.email || ''}
						class="inverseShadow h-10 w-full rounded-2xl border border-border bg-background/20 px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/55 focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
						required
					/>
				</div>

				{#if form?.message}
					<p
						class="rounded-xl border {form.success
							? 'border-primary/30 bg-primary/10 text-foreground'
							: 'border-red-400/20 bg-red-500/10 text-red-100'} p-3 text-xs"
					>
						{form.message}
					</p>
				{/if}

				<button
					type="submit"
					class="rd-squircle h-10 rounded-xl bg-primary text-sm font-bold text-rd-on-accent shadow-[inset_0_-3px_4px_0_#3b906b96] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
				>
					Send reset link
				</button>
			</form>
		</section>
	</div>
</div>
