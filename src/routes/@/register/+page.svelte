<script>
	import { resolve } from '$app/paths';
	import { browser } from '$app/environment';
	import {
		normalizeUsername,
		validateEmailFormat,
		validatePassword,
		validateUsernameFormat
	} from '$lib/auth-validation';
	import { Eye, EyeOff } from 'lucide-svelte';
	import 'iconify-icon';

	let { data, form } = $props();
	let showPassword = $state(false);
	let email = $state('');
	let username = $state('');
	let password = $state('');
	let formHydrated = $state(false);
	let usernameCheck = $state({ status: 'idle', message: 'We can make one from your email.' });

	let emailValidation = $derived(validateEmailFormat(email));
	let usernameFormat = $derived(validateUsernameFormat(username, { optional: true }));
	let passwordValidation = $derived(validatePassword(password));
	let canSubmit = $derived(
		emailValidation.valid &&
			passwordValidation.valid &&
			usernameFormat.valid &&
			usernameCheck.status !== 'checking' &&
			usernameCheck.status !== 'invalid'
	);

	function validationClass(valid) {
		return valid ? 'text-[var(--rd-mint)]' : 'text-[var(--rd-yellow)]';
	}

	$effect(() => {
		if (formHydrated) return;
		email = form?.email || '';
		username = form?.username || '';
		formHydrated = true;
	});

	$effect(() => {
		const value = normalizeUsername(username);
		const format = validateUsernameFormat(value, { optional: true });
		if (!browser || !value || !format.valid) {
			usernameCheck = {
				status: format.valid ? 'idle' : 'invalid',
				message: format.message
			};
			return;
		}

		const controller = new AbortController();
		usernameCheck = { status: 'checking', message: 'Checking username...' };
		const timeout = window.setTimeout(async () => {
			try {
				const response = await fetch(resolve('/api/auth/validate'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ field: 'username', value }),
					signal: controller.signal
				});
				const result = await response.json();
				usernameCheck = {
					status: result.valid && result.available ? 'valid' : 'invalid',
					message: result.message || 'Could not check username.'
				};
			} catch (error) {
				if (error?.name === 'AbortError') return;
				usernameCheck = { status: 'invalid', message: 'Could not check username.' };
			}
		}, 350);

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	});
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
				class="rd-squircle rd-shadow-lift absolute left-1/2 top-14 flex h-6 min-w-[8.75rem] -translate-x-1/2 rotate-[3deg] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-[var(--rd-yellow)] px-3 text-xs font-semibold text-[#161517]"
			>
				<iconify-icon icon="lucide:user-round-plus" width="13"></iconify-icon>
				<span class="shrink-0">create account</span>
			</div>
		</header>

		<section
			data-auth-flip
			data-flip-id="auth-panel"
			class="rd-squircle rd-shadow-panel rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] p-4"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h1 class="font-jak-display text-2xl font-black leading-none text-[var(--rd-ink)]">
						join in
					</h1>
					<p class="mt-1 text-xs text-[var(--rd-muted)]">make your link setup permanent</p>
				</div>
				<a
					data-auth-flip
					data-flip-id="auth-switch"
					href={resolve('/@/login')}
					class="hover:scale-80 flex h-8 w-fit items-center rounded-2xl border border-[rgba(57,54,77,0.2)] bg-[rgba(57,54,77,0.2)] px-4 py-2 text-xs font-light leading-none text-[#fafafa] no-underline shadow-[0px_1px_1.2px_0px_rgba(16,17,17,0.54),inset_0px_-3px_2px_0px_rgba(24,24,27,0.32),inset_0px_1.2px_2.7px_0px_rgba(145,95,183,0.78)] hover:transform hover:bg-secondary/80 hover:shadow-[0.1px_1px_1.7px_0px_rgba(62,56,88,0.49),inset_1px_3px_3px_2px_rgba(9,7,17,0.47)]"
				>
					login
				</a>
			</div>

			{#if data?.hasGuestSession}
				<p
					class="mb-4 rounded-xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] p-3 text-xs leading-tight text-[var(--rd-muted)]"
				>
					You have guest links on this device. Creating an account will move them into it.
				</p>
			{/if}

			<form method="POST" class="grid gap-3">
				<div class="grid gap-1.5">
					<label for="email" class="pl-1 text-xs text-[var(--rd-ink)]">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						bind:value={email}
						class="inverseShadow h-10 w-full rounded-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.2)] px-3 text-xs text-[var(--rd-ink)] outline-none placeholder:text-[#b9c0d08c] focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
						required
					/>
					{#if email}
						<p class="pl-1 text-xs {validationClass(emailValidation.valid)}">
							{emailValidation.message}
						</p>
					{/if}
				</div>

				<div class="grid gap-1.5">
					<label for="username" class="pl-1 text-xs text-[var(--rd-ink)]">
						Username <span class="text-[var(--rd-muted)]">optional</span>
					</label>
					<input
						id="username"
						name="username"
						autocomplete="username"
						bind:value={username}
						class="inverseShadow h-10 w-full rounded-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.2)] px-3 text-xs text-[var(--rd-ink)] outline-none placeholder:text-[#b9c0d08c] focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
					/>
					<p
						class="pl-1 text-xs {usernameCheck.status === 'valid' || usernameCheck.status === 'idle'
							? 'text-[var(--rd-mint)]'
							: 'text-[var(--rd-yellow)]'}"
					>
						{usernameCheck.message}
					</p>
				</div>

				<div class="grid gap-1.5">
					<div class="flex items-center justify-between gap-3 pl-1">
						<label for="password" class="text-xs text-[var(--rd-ink)]">Password</label>
						<span class="text-xs {validationClass(passwordValidation.valid)}">8+ characters</span>
					</div>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							bind:value={password}
							class="inverseShadow h-10 w-full rounded-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.2)] px-3 pr-10 text-xs text-[var(--rd-ink)] outline-none placeholder:text-[#b9c0d08c] focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
							required
						/>
						<button
							type="button"
							class="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl text-[var(--rd-muted)] transition-colors hover:bg-[rgba(16,17,17,0.5)] hover:text-[var(--rd-ink)]"
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
					{#if password}
						<p class="pl-1 text-xs {validationClass(passwordValidation.valid)}">
							{passwordValidation.message}
						</p>
					{/if}
				</div>

				{#if form?.message}
					<p class="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">
						{form.message}
					</p>
				{/if}

				<button
					type="submit"
					class="rd-squircle mb-4 mt-2 h-10 rounded-xl bg-[var(--rd-mint)] text-sm font-bold text-[#161517] shadow-[inset_0_-3px_4px_0_#3b906b96] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!canSubmit}
				>
					create account
				</button>
			</form>
		</section>
	</div>
</div>
