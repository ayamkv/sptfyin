<script>
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Home, CircleUserRound, HandHeart, Info, History, Trophy } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
	import logo from '$lib/images/logo.png';
	import MaintenanceToast from '$lib/components/maintenance-toast.svelte';

	import { onMount } from 'svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	let isCollapsed = true;
	let currentPath = $derived($page.url.pathname);
	let isActive = $derived.by(() => (routeLabel) => {
		if (routeLabel === '/about/general' && currentPath.includes('about/')) {
			return true;
		}
		return routeLabel === currentPath;
	});
	let routes = [
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
			label: '/recent',
			visible: true,
			section: 'actions'
		},
		{
			title: 'top',
			icon: Trophy,
			variant: 'ghost',
			label: '/top',
			visible: true,
			mobileVisible: false,
			section: 'actions'
		},
		{
			title: 'profile',
			icon: CircleUserRound,
			variant: 'ghost',
			label: '/dashboard/profile',
			visible: false,
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
			label: '/about/general',
			visible: true,
			section: 'info'
		}
	];

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
			class="md:highlightNav2 group fixed bottom-[7px] left-1/2 z-50 flex h-[86px] w-[calc(100%-33px)] max-w-[369px] -translate-x-1/2 flex-col bg-transparent data-[collapsed=true]:py-0 sm:rounded-none md:static md:bottom-auto md:left-auto md:h-auto md:min-h-screen md:w-24 md:max-w-none md:translate-x-0 md:bg-none md:shadow-none"
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
				class="grid h-full grid-cols-4 items-center gap-2 pb-2 pt-1 md:h-auto md:grid-cols-none md:justify-start md:gap-2 md:px-2
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
									class="h-[74px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-0 text-[var(--rd-ink)] no-underline hover:bg-transparent hover:outline-primary md:size-20 md:w-full md:gap-1 md:rounded-md
									{route.mobileVisible === false ? 'hidden md:flex' : 'flex'}
									{isActive(route.label)
										? 'rd-shadow-nav-active md:inverseShadow md:hover:highlight bg-[#10111199] md:bg-background/60 md:text-foreground md:hover:bg-primary/90 md:hover:text-background'
										: route.variant === 'default'
											? 'md:highlightCard bg-transparent md:dark:bg-muted md:dark:text-muted-foreground md:dark:hover:bg-secondary/40'
											: 'bg-transparent'}"
								>
									<route.icon class="size-8" aria-hidden="true" />
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
