<script>
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Home, CircleUserRound, HandHeart, Info, History, Trophy, Cat } from 'lucide-svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { SvelteMap } from 'svelte/reactivity';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import logo from '$lib/images/logo.png';
	import MaintenanceToast from '$lib/components/maintenance-toast.svelte';

	import { onMount } from 'svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('./$types').LayoutData} data
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { data, children } = $props();
	let user = $derived(data?.user || null);

	let isCollapsed = true;
	let currentPath = $derived($page.url.pathname);
	let isActive = $derived.by(() => (routeLabel) => {
		if (routeLabel === '/@/about/general' && currentPath.includes('/@/about/')) {
			return true;
		}
		if (routeLabel === '/@/dash/links' && currentPath.startsWith('/@/dash/')) {
			return true;
		}
		return routeLabel === currentPath;
	});
	let routes = $derived([
		{
			title: 'home',
			icon: Home,
			variant: 'ghost',
			label: '/',
			visible: true,
			section: 'actions'
		},
		{
			title: 'recent',
			icon: History,
			variant: 'ghost',
			label: '/@/recent',
			visible: true,
			section: 'actions'
		},
		{
			title: 'top',
			icon: Trophy,
			variant: 'ghost',
			label: '/@/top',
			visible: true,
			mobileVisible: false,
			section: 'actions'
		},
		{
			title: 'updates',
			icon: Cat,
			variant: 'ghost',
			label: '/@/updates',
			visible: true,
			mobileVisible: false,
			section: 'actions'
		},
		user
			? {
					title: 'profile',
					icon: CircleUserRound,
					variant: 'ghost',
					label: '/@/dash/links',
					visible: true,
					section: 'info'
				}
			: {
					title: 'login',
					icon: CircleUserRound,
					variant: 'ghost',
					label: '/@/login',
					visible: true,
					section: 'info'
				},
		{
			title: 'donate',
			icon: HandHeart,
			variant: 'ghost',
			label: 'https://ko-fi.com/freqtion',
			visible: true,
			section: 'info'
		},
		{
			title: 'about',
			icon: Info,
			variant: 'ghost',
			label: '/@/about/general',
			visible: true,
			section: 'info'
		}
	]);

	// Avatar (mirrors the dashboard header pattern, with a session-scoped cache)
	const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;
	const spotifyAvatarCache = new SvelteMap();
	let avatarUrl = $state('');
	let avatarLoading = $state(false);
	let avatarRequestId = 0;

	async function loadSpotifyAvatar(currentUser) {
		if (!currentUser?.spotify_id) {
			avatarLoading = false;
			return;
		}
		const cached = spotifyAvatarCache.get(currentUser.id);
		if (cached !== undefined) {
			avatarUrl = cached;
			avatarLoading = false;
			return;
		}
		const reqId = ++avatarRequestId;
		avatarLoading = true;
		try {
			const microlinkUrl = `https://api.microlink.io/?url=https://open.spotify.com/user/${currentUser.spotify_id}`;
			const response = await fetch(microlinkUrl);
			if (!response.ok) {
				throw new Error(`Microlink API error: ${response.status}`);
			}
			const data = await response.json();
			if (data.status === 'success' && data.data?.image?.url) {
				avatarUrl = data.data.image.url;
				spotifyAvatarCache.set(currentUser.id, avatarUrl);
			} else {
				avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${currentUser.id}`;
				spotifyAvatarCache.set(currentUser.id, avatarUrl);
			}
		} catch (e) {
			console.warn('[Layout] Failed to fetch avatar:', e);
			avatarUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${currentUser.id}`;
			spotifyAvatarCache.set(currentUser.id, avatarUrl);
		} finally {
			if (reqId === avatarRequestId) {
				avatarLoading = false;
			}
		}
	}

	$effect(() => {
		if (user?.id) {
			loadSpotifyAvatar(user);
		} else {
			avatarRequestId++;
			avatarUrl = '';
			avatarLoading = false;
		}
	});

	// enable background decorations globally via class toggle
	onMount(() => {
		if (typeof document !== 'undefined') {
			document.body.classList.add('bg-decor-enabled');
			return () => document.body.classList.remove('bg-decor-enabled');
		}
	});
</script>

<Toaster duration={4000} position="top-center" />
<MaintenanceToast />

<!-- Global background noise overlay (z-index behind content) -->
<!-- <BackgroundNoise baseFrequency={0.8} numOctaves={2} scale={1} /> -->

<Tooltip.Provider>
	<div
		class="scrollbar-gutter-stable md:highlightN fixed inset-0 flex
    rounded-md bg-background/30 md:flex-row md:rounded-none"
	>
		<div
			data-collapsed={isCollapsed}
			class="md:highlightNav2 group fixed bottom-[7px] left-1/2 z-50 flex h-[86px] w-[calc(100%-33px)] max-w-[369px] -translate-x-1/2 flex-col bg-transparent data-[collapsed=true]:py-0 sm:rounded-none md:static md:bottom-auto md:left-auto md:h-auto md:min-h-screen md:w-24 md:max-w-none md:translate-x-0 md:bg-[#1b191e] md:shadow-none"
		>
			<!-- Logo (desktop only) -->
			<a
				class="sptfyin-logo mx-auto my-4 hidden size-16 items-center justify-center md:flex"
				href={resolve('/')}
			>
				<img src={logo} alt="Sptfyin Logo" class="h-full w-full" />
			</a>

			<!-- Navigation -->
			<nav
				class="grid h-full grid-cols-5 items-center gap-2 pb-2 pt-1 md:h-auto md:grid-cols-none md:justify-items-center md:gap-2 md:px-2
						group-[[data-collapsed=true]]:md:justify-center"
			>
				{#each routes.filter((route) => route.visible) as route (route.label)}
					<Tooltip.Root openDelay={0}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									href={route.label.startsWith('/') ? resolve(route.label) : route.label}
									variant={route.variant}
									size="icon"
									class="h-[74px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0 text-[var(--rd-ink)] no-underline hover:bg-transparent hover:outline-primary md:h-20 md:w-20 md:gap-1 md:rounded-md
									{route.mobileVisible === false ? 'hidden md:flex' : 'flex'}
									{isActive(route.label)
										? 'rd-shadow-nav-active md:inverseShadow md:hover:highlight bg-[#10111199] md:bg-background/60 md:text-foreground md:hover:bg-primary/90 md:hover:text-background'
										: route.variant === 'default'
											? 'md:highlightCard bg-transparent md:dark:bg-muted md:dark:text-muted-foreground md:dark:hover:bg-secondary/40'
											: 'bg-transparent'}"
								>
									{#if route.title === 'profile' && user}
										<Avatar class="h-8 w-8">
											{#if avatarLoading}
												<div class="h-full w-full animate-pulse rounded-full bg-muted"></div>
											{:else}
												<AvatarImage
													src={avatarUrl ||
														`${pocketBaseURL}/api/files/_pb_users_auth_/${user.id}/${user.avatar}`}
													alt={user.username}
												/>
												<AvatarFallback>
													{(user.name || user.username || 'U').slice(0, 2).toUpperCase()}
												</AvatarFallback>
											{/if}
										</Avatar>
									{:else}
										<route.icon class="size-8" aria-hidden="true" />
									{/if}
									<span
										class="{isActive(route.label)
											? 'inline-block'
											: 'sr-only'} text-xs leading-4 no-underline md:inline-block"
										>{route.title}</span
									>
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="top" class="flex items-center gap-4">
							{route.title}
						</Tooltip.Content>
						<Tooltip.Content side="right" class="flex items-center gap-4">
							{route.title}
							{#if route.label}
								<span class="ml-auto text-muted-foreground">
									{route.label}
								</span>
							{/if}
						</Tooltip.Content>
					</Tooltip.Root>
				{/each}
			</nav>
		</div>
		<main
			class="h-screen max-w-full flex-1 overflow-y-auto overflow-x-hidden bg-card/95 selection:bg-primary selection:text-background sm:overflow-y-hidden md:rounded-lg md:py-4 md:pl-0 md:pr-4"
		>
			{@render children?.()}
		</main>
	</div>
</Tooltip.Provider>
