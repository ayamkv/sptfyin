<script>
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { validateEmailFormat, validatePassword } from '$lib/auth-validation';
	import { onMount, tick } from 'svelte';
	import { ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-svelte';
	import 'iconify-icon';

	let { data, form } = $props();
	let loadingProvider = $state('');
	let popupWindow = $state(null);
	let showPassword = $state(false);
	let popupBlockedMessage = $state('');
	let email = $state('');
	let password = $state('');
	let formHydrated = $state(false);
	let emailAccordionOpen = $state(false);
	let emailForm;
	let emailAccordionAnimation;
	let emailAccordionGsap;
	let emailAccordionLoad;
	let reduceMotion = false;

	const AUTH_ACCORDION_EASE = 'elastic.out(1,1)';
	const AUTH_ACCORDION_DURATION = 0.4;

	let hasLoginError = $derived(form?.mode === 'login' && form?.message);
	let emailValidation = $derived(validateEmailFormat(email));
	let passwordValidation = $derived(validatePassword(password));
	let canSubmitEmailLogin = $derived(emailValidation.valid && passwordValidation.valid);

	function validationClass(valid) {
		return valid ? 'text-primary' : 'text-rd-yellow';
	}

	$effect(() => {
		if (formHydrated) return;
		email = form?.email || '';
		formHydrated = true;
	});

	$effect(() => {
		if (hasLoginError) emailAccordionOpen = true;
	});

	function handleOAuthLogin(provider) {
		loadingProvider = provider;
		popupBlockedMessage = '';
		if (!browser) {
			loadingProvider = '';
			return;
		}

		const authUrl = resolve(`/@/auth/${provider}?popup=1`);
		popupWindow = window.open(authUrl, 'sptfyin-oauth', 'popup,width=520,height=720');
		if (!popupWindow) {
			popupBlockedMessage = 'Popup blocked. Redirecting instead...';
			window.location.href = resolve(`/@/auth/${provider}`);
			return;
		}

		popupWindow.focus();
	}

	async function loadEmailAccordionGsap() {
		if (emailAccordionGsap) return emailAccordionGsap;

		emailAccordionLoad ??= import('gsap')
			.then((module) => {
				emailAccordionGsap = module.gsap || module.default || module;
				return emailAccordionGsap;
			})
			.catch((error) => {
				console.error('[Auth Accordion] Could not load GSAP', error);
				return null;
			});

		return emailAccordionLoad;
	}

	async function animateEmailAccordionOpen() {
		if (reduceMotion || !emailForm) return;

		const loadedGsap = await loadEmailAccordionGsap();
		if (!loadedGsap || !emailForm) return;

		emailAccordionAnimation?.kill();
		emailAccordionAnimation = loadedGsap.fromTo(
			emailForm,
			{
				autoAlpha: 0,
				height: 0,
				overflow: 'hidden',
				scaleY: 0.96,
				transformOrigin: 'top center',
				y: -8
			},
			{
				autoAlpha: 1,
				height: 'auto',
				overflow: 'hidden',
				scaleY: 1,
				y: 0,
				duration: AUTH_ACCORDION_DURATION,
				ease: AUTH_ACCORDION_EASE,
				overwrite: true,
				clearProps: 'height,overflow,opacity,visibility,transform'
			}
		);
	}

	async function animateEmailAccordionClose() {
		if (reduceMotion || !emailForm) {
			emailAccordionOpen = false;
			return;
		}

		const loadedGsap = await loadEmailAccordionGsap();
		if (!loadedGsap || !emailForm) {
			emailAccordionOpen = false;
			return;
		}

		emailAccordionAnimation?.kill();
		emailAccordionAnimation = loadedGsap.to(emailForm, {
			autoAlpha: 0,
			height: 0,
			overflow: 'hidden',
			scaleY: 0.96,
			transformOrigin: 'top center',
			y: -8,
			duration: AUTH_ACCORDION_DURATION,
			ease: AUTH_ACCORDION_EASE,
			overwrite: true,
			onComplete: () => {
				emailAccordionOpen = false;
			}
		});
	}

	async function handleEmailAccordionClick() {
		if (emailAccordionOpen) {
			await animateEmailAccordionClose();
			return;
		}

		emailAccordionOpen = true;
		await tick();
		await animateEmailAccordionOpen();
	}

	onMount(() => {
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updateReduceMotion = () => {
			reduceMotion = motionQuery.matches;
		};

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

		updateReduceMotion();
		motionQuery.addEventListener('change', updateReduceMotion);
		if (!reduceMotion) void loadEmailAccordionGsap();

		window.addEventListener('message', handleOAuthMessage);
		return () => {
			emailAccordionAnimation?.kill();
			motionQuery.removeEventListener('change', updateReduceMotion);
			window.removeEventListener('message', handleOAuthMessage);
			window.clearInterval(closeCheck);
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
				class="rd-squircle rd-shadow-lift absolute left-1/2 top-14 flex h-6 min-w-[8.75rem] -translate-x-1/2 rotate-[-3deg] items-center justify-center gap-1 whitespace-nowrap rounded-full bg-rd-yellow px-3 text-xs font-semibold text-rd-on-accent"
			>
				<iconify-icon icon="lucide:key-round" width="13"></iconify-icon>
				<span class="shrink-0">sign in</span>
			</div>
		</header>

		<section
			data-auth-flip
			data-flip-id="auth-panel"
			class="rd-squircle rd-shadow-panel rounded-2xl border border-border bg-card px-4 pb-8 pt-4"
		>
			<div class="mb-4 flex items-start justify-between gap-3">
				<div>
					<h1
						data-flip-id="auth-title"
						class="font-jak-display text-2xl font-black leading-none text-foreground"
					>
						welcome back
					</h1>
					<p class="mt-1 text-xs text-rd-muted">pick up where your links left off</p>
				</div>
				<a
					data-auth-flip
					data-flip-id="auth-switch"
					href={resolve('/@/register')}
					class="hover:scale-80 rd-shadow-raised hover:rd-shadow-inset flex h-8 w-fit items-center rounded-2xl border border-secondary/20 bg-secondary/20 px-4 py-2 text-xs font-light leading-none text-secondary-foreground no-underline hover:transform hover:bg-secondary/80"
				>
					register
				</a>
			</div>

			{#if data?.hasGuestSession}
				<p
					class="mb-4 rounded-xl border border-border bg-background/25 p-3 text-xs leading-tight text-rd-muted"
				>
					You have guest links on this device. Signing in will move them into your account.
				</p>
			{/if}

			<div class="grid gap-2">
				<!-- <p class="pl-1 text-xs font-normal text-primary">quick sign in</p> -->
				<button
					type="button"
					class="rd-squircle flex h-11 w-full items-center justify-start gap-3 rounded-2xl border border-[#dadce0] bg-white px-4 text-sm font-semibold text-[#1f1f1f] transition-transform duration-150 hover:scale-[1.01] hover:bg-[#d0d2d4] active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
					onclick={() => handleOAuthLogin('google')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'google'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Opening Google...
					{:else}
						<iconify-icon icon="logos:google-icon" width="18" class="h-[18px] w-[18px]"
						></iconify-icon>
						Continue with Google
						<ArrowRight class="ml-auto h-4 w-4 text-[#5f6368]" />
					{/if}
				</button>

				<button
					type="button"
					class="rd-squircle flex h-11 w-full items-center justify-start gap-3 rounded-2xl bg-[#5865F2] px-4 text-sm font-semibold text-white transition-transform duration-150 hover:scale-[1.01] hover:bg-[#4752c4] active:scale-[0.99] disabled:cursor-wait disabled:opacity-75"
					onclick={() => handleOAuthLogin('discord')}
					disabled={!!loadingProvider}
				>
					{#if loadingProvider === 'discord'}
						<Loader2 class="h-4 w-4 animate-spin" />
						Opening Discord...
					{:else}
						<iconify-icon
							icon="simple-icons:discord"
							width="18"
							class="h-[18px] w-[18px] text-white"
						></iconify-icon>
						Continue with Discord
						<ArrowRight class="ml-auto h-4 w-4 text-white/70" />
					{/if}
				</button>

				{#if popupBlockedMessage}
					<p class="pl-1 text-xs text-rd-yellow">{popupBlockedMessage}</p>
				{/if}
			</div>

			<div class="my-4 flex items-center gap-3 text-[0.625rem] text-rd-muted">
				<div class="h-px flex-1 bg-muted/80"></div>
				<span>𓂃˖˳·˖ ִֶָ ⋆ or ͙⋆ ִֶָ˖·˳˖𓂃 ִֶָ</span>
				<div class="h-px flex-1 bg-muted/80"></div>
			</div>

			<div>
				<button
					type="button"
					aria-expanded={emailAccordionOpen}
					onclick={handleEmailAccordionClick}
					class="flex w-full cursor-pointer list-none items-center justify-between rounded-xl px-1 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary"
				>
					<span>sign in with email</span>
					<iconify-icon
						icon="lucide:chevron-down"
						width="16"
						class="transition-transform duration-200 {emailAccordionOpen ? 'rotate-180' : ''}"
					></iconify-icon>
				</button>

				<form
					bind:this={emailForm}
					method="POST"
					action="?/login"
					aria-hidden={!emailAccordionOpen}
					style={emailAccordionOpen
						? undefined
						: 'height: 0; overflow: hidden; opacity: 0; visibility: hidden;'}
					class="grid gap-3 pt-2"
				>
					<div class="grid gap-1.5">
						<label for="login-email" class="pl-1 text-xs text-foreground">Email</label>
						<input
							id="login-email"
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
						<div class="flex items-center justify-between gap-3 pl-1">
							<label for="login-password" class="text-xs text-foreground">Password</label>
							<a
								href={resolve('/@/forgot-password')}
								class="text-xs font-semibold text-primary no-underline hover:text-primary hover:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							>
								forgot?
							</a>
						</div>
						<div class="relative">
							<input
								id="login-password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								autocomplete="current-password"
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

					{#if hasLoginError}
						<p class="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">
							{form.message}
						</p>
					{/if}

					<button
						type="submit"
						class="rd-squircle h-10 rounded-xl bg-primary text-sm font-bold text-rd-on-accent shadow-[inset_0_-3px_4px_0_#3b906b96] transition-transform duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
						disabled={!canSubmitEmailLogin}
					>
						log in
					</button>
				</form>
			</div>
		</section>
	</div>
</div>
