<script>
	import '../app.css';
	import { Toaster } from '$lib/components/ui/sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Home, CircleUserRound, HandHeart, Info, History } from 'lucide-svelte';
	import { page } from '$app/stores';
	import logo from '$lib/images/logo.png';

	import { onMount } from 'svelte';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	let isCollapsed = true;
	let currentPath = $derived($page.url.pathname);
	let isActive = $derived((routeLabel) => {
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

<!-- Global background noise overlay (z-index behind content) -->
<!-- <BackgroundNoise baseFrequency={0.8} numOctaves={2} scale={1} /> -->

<div
	class="scrollbar-gutter-stable md:highlightN fixed inset-0 flex
    rounded-md bg-background/30 md:flex-row md:rounded-none"
>
	<!--- todo: fix the gradient, we need to hide the gradient in large displays like desktop using sm:, and show it in mobile.-->
	<div
		data-collapsed={isCollapsed}
		class="highlightNav2 group fixed bottom-0 left-0 right-0 z-50 flex flex-col
                    bg-card/95 data-[collapsed=true]:py-0 sm:rounded-none md:static md:bottom-auto
                   md:min-h-screen md:w-24
                   md:bg-none md:shadow-none"
	>
		<!-- Logo (desktop only) -->
		<a
			class="sptfyin-logo mx-auto my-4 hidden size-16 items-center justify-center md:flex"
			href="/"
		>
			<img src={logo} alt="Sptfyin Logo" class="h-full w-full" />
		</a>

		<!-- Navigation -->
		<nav
			class="flex items-center justify-evenly px-1 py-1 pb-2 md:grid md:justify-start md:gap-2 md:px-2
                        group-[[data-collapsed=true]]:md:justify-center"
		>
			{#each routes.filter((route) => route.visible) as route (route.label)}
				<Tooltip.Root openDelay={0}>
					<Tooltip.Trigger asChild>
						{#snippet children({ builder })}
							<Button
								href={route.label}
								variant={route.variant}
								size="icon"
								class="hover:inverseShadow size-14
                                    hover:bg-secondary/80
                                    hover:outline-primary
                                    md:size-20
                                    {isActive(route.label)
									? ' md:hover:highlight inverseShadow bg-background/40 md:bg-background/60 md:text-foreground md:hover:bg-primary/90 md:hover:text-background'
									: route.variant === 'default'
										? 'highlightCard dark:bg-muted dark:text-muted-foreground  dark:hover:bg-secondary/40'
										: ''}
                                    flex w-full flex-col items-center justify-center gap-0 rounded-md px-2 no-underline md:gap-1 md:rounded-md md:px-0
                                    "
							>
								<route.icon class="size-6 md:size-8" aria-hidden="true" />
								<span class="hidden text-xs no-underline md:inline-block">{route.title}</span>
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
		class="h-screen max-w-full flex-1 bg-card/95 overflow-y-auto overflow-x-hidden selection:bg-primary selection:text-background sm:overflow-y-hidden md:rounded-lg md:py-4 md:pl-0 md:pr-4"
	>
		{@render children?.()}
	</main>
</div>
