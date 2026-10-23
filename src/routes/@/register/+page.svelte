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
		return valid ? 'text-primary' : 'text-rd-yellow';
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
				class="rd-squircle rd-shadow-lift absolute left-1/2 top-14 flex h-6 min-w-[8.75rem] -translate-x-1/2 rotate-[3deg] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-rd-yellow px-3 text-xs font-semibold text-rd-on-accent"
			>
				<iconify-icon icon="lucide:user-round-plus" width="13"></iconify-icon>
				<span class="shrink-0">create account</span>
			</div>
		</header>

		<section
			data-auth-flip
			data-flip-id="auth-panel"
			class="rd-squircle rd-shadow-panel rounded-2xl border border-border bg-card p-4"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h1 class="font-jak-display text-2xl font-black leading-none text-foreground">join in</h1>
					<p class="mt-1 text-xs text-rd-muted">make your link setup permanent</p>
				</div>
				<a
					data-auth-flip
					data-flip-id="auth-switch"
					href={resolve('/@/login')}
					class="hover:scale-80 rd-shadow-raised hover:rd-shadow-inset flex h-8 w-fit items-center rounded-2xl border border-secondary/20 bg-secondary/20 px-4 py-2 text-xs font-light leading-none text-secondary-foreground no-underline hover:transform hover:bg-secondary/80"
				>
					login
				</a>
			</div>

			{#if data?.hasGuestSession}
				<p
					class="mb-4 rounded-xl border border-border bg-background/25 p-3 text-xs leading-tight text-rd-muted"
				>
					You have guest links on this device. Creating an account will move them into it.
				</p>
			{/if}

			<form method="POST" class="grid gap-3">
				<div class="grid gap-1.5">
					<label for="email" class="pl-1 text-xs text-foreground">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						bind:value={email}
						class="inverseShadow h-10 w-full rounded-2xl border border-border bg-background/20 px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/55 focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
						required
					/>
					{#if email}
						<p class="pl-1 text-xs {validationClass(emailValidation.valid)}">
							{emailValidation.message}
						</p>
					{/if}
				</div>

				<div class="grid gap-1.5">
					<label for="username" class="pl-1 text-xs text-foreground">
						Username <span class="text-rd-muted">optional</span>
					</label>
					<input
						id="username"
						name="username"
						autocomplete="username"
						bind:value={username}
						class="inverseShadow h-10 w-full rounded-2xl border border-border bg-background/20 px-3 text-xs text-foreground outline-none placeholder:text-muted-foreground/55 focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
					/>
					<p
						class="pl-1 text-xs {usernameCheck.status === 'valid' || usernameCheck.status === 'idle'
							? 'text-primary'
							: 'text-rd-yellow'}"
					>
						{usernameCheck.message}
					</p>
				</div>

				<div class="grid gap-1.5">
					<div class="flex items-center justify-between gap-3 pl-1">
						<label for="password" class="text-xs text-foreground">Password</label>
						<span class="text-xs {validationClass(passwordValidation.valid)}">8+ characters</span>
					</div>
					<div class="relative">
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="new-password"
							bind:value={password}
							class="inverseShadow h-10 w-full rounded-2xl border border-border bg-background/20 px-3 pr-10 text-xs text-foreground outline-none placeholder:text-muted-foreground/55 focus:shadow-[0px_0px_0px_2px_#101111,0px_0px_0px_4px_#00aa6a]"
							required
						/>
						<button
							type="button"
							class="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl text-rd-muted transition-colors hover:bg-background/50 hover:text-foreground"
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
					class="rd-squircle mb-4 mt-2 h-10 rounded-xl bg-primary text-sm font-bold text-rd-on-accent shadow-[inset_0_-3px_4px_0_#3b906b96] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!canSubmit}
				>
					create account
				</button>
			</form>
		</section>
	</div>
</div>
