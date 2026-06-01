<script>
	import { resolve } from '$app/paths';
	import 'iconify-icon';

	let { form } = $props();
</script>

<div class="min-h-[calc(100vh-8rem)] bg-[var(--rd-bg)] px-4 py-8 text-[var(--rd-ink)]">
	<div class="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-[25rem] flex-col justify-center">
		<header class="relative mx-auto mb-8 h-20 w-full max-w-[21rem]">
			<a
				data-auth-flip
				data-flip-id="auth-logo"
				href={resolve('/')}
				class="ss03 absolute left-1/2 top-0 -translate-x-1/2 rounded-none font-jak-display text-5xl font-black leading-none text-[var(--rd-mint)] no-underline outline-none hover:text-[var(--rd-mint)] hover:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-mint)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--rd-bg)]"
			>
				sptfy.in
			</a>
			<div
				data-auth-flip
				data-flip-id="auth-chip"
				class="rd-squircle rd-shadow-lift absolute left-1/2 top-14 flex h-6 min-w-[8.75rem] -translate-x-1/2 rotate-[-2deg] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[var(--rd-yellow)] px-3 text-xs font-semibold text-[#161517]"
			>
				<iconify-icon icon="lucide:mail" width="13"></iconify-icon>
				<span class="shrink-0">reset password</span>
			</div>
		</header>

		<section
			data-auth-flip
			data-flip-id="auth-panel"
			class="rd-squircle rd-shadow-panel rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] p-4"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h1
						data-auth-flip
						data-flip-id="auth-title"
						class="font-jak-display text-2xl font-black leading-none text-[var(--rd-ink)]"
					>
						forgot password?
					</h1>
					<p class="mt-1 text-xs text-[var(--rd-muted)]">
						we'll send a reset link if the email exists
					</p>
				</div>
				<a
					data-auth-flip
					data-flip-id="auth-switch"
					href={resolve('/@/login')}
					class="rounded-xl bg-[rgba(16,17,17,0.24)] px-3 py-2 text-xs font-semibold text-[var(--rd-mint)] no-underline hover:text-[var(--rd-mint)] hover:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rd-mint)]"
				>
					login
				</a>
			</div>

			<form data-auth-flip method="POST" class="grid gap-3">
				<div class="grid gap-1.5">
					<label for="email" class="pl-1 text-xs text-[var(--rd-ink)]">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						value={form?.email || ''}
						class="inverseShadow h-10 w-full rounded-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.2)] px-3 text-xs text-[var(--rd-ink)] outline-none placeholder:text-[#b9c0d08c] focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
						required
					/>
				</div>

				{#if form?.message}
					<p
						class="rounded-xl border {form.success
							? 'border-[var(--rd-mint)]/30 bg-[rgba(74,227,161,0.1)] text-[var(--rd-ink)]'
							: 'border-red-400/20 bg-red-500/10 text-red-100'} p-3 text-xs"
					>
						{form.message}
					</p>
				{/if}

				<button
					type="submit"
					class="rd-squircle h-10 rounded-xl bg-[var(--rd-mint)] text-sm font-bold text-[#161517] shadow-[inset_0_-3px_4px_0_#3b906b96] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99]"
				>
					Send reset link
				</button>
			</form>
		</section>
	</div>
</div>
