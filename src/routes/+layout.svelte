<script>
    import "../app.css";
    import { Toaster } from "$lib/components/ui/sonner";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { Button } from "$lib/components/ui/button";    import { Home, CircleUserRound, Library, Plus, HandHeart, Info, History } from "lucide-svelte";
    import { page } from "$app/stores";
    import logo from "$lib/images/logo.png";
    import BackgroundNoise from "$lib/components/BackgroundNoise.svelte";
    import { onMount } from "svelte";
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
            title: "home",
            icon: Home,
            variant: "ghost",
            label: "/",
            visible: true,
            section: 'actions'
        },
        {
            title: "recent",
            icon: History,
            variant: "ghost",
            label: "/recent",
            visible: true,
            section: 'actions'
        },
        {
            title: "profile",
            icon: CircleUserRound,
            variant: "ghost",
            label: "/dashboard/profile",
            visible: false,
            section: 'info'
        },
        {
            title: "donate",
            icon: HandHeart,
            variant: "ghost",
            label: "https://ko-fi.com/freqtion",
            visible: true,
            section: 'info'
        },
        {
            title: "about",
            icon: Info,
            variant: "ghost",
            label: "/about/general",
            visible: true,
            section: 'info'
        }
    ]

    // enable background decorations globally via class toggle
    onMount(() => {
        if (typeof document !== 'undefined') {
            document.body.classList.add('bg-decor-enabled');
            return () => document.body.classList.remove('bg-decor-enabled');
        }
    });
</script>

<Toaster duration={4000} position="top-center"/>

<!-- Global background noise overlay (z-index behind content) -->
<!-- <BackgroundNoise baseFrequency={0.8} numOctaves={2} scale={1} /> -->

<div class="fixed inset-0 flex md:flex-row scrollbar-gutter-stable
    bg-gradient-to-br rounded-md md:rounded-none md:bg-gradient-to-t from-[#332c4e]/80 md:via-card via-card/70 via-30% to-card  text-card-foreground md:highlightN bg-background/30  ">

    <!--- todo: fix the gradient, we need to hide the gradient in large displays like desktop using sm:, and show it in mobile.-->
        <div data-collapsed={isCollapsed}
            class="group flex flex-col md:bg-none bg-gradient-to-br via-30% to-card md:backdrop-blur-[0] sm:rounded-none rounded-md backdrop-blur-sm highlightNav2 md:shadow-none
                   fixed md:static bottom-0 md:bottom-auto left-0 right-0 md:w-24
                   border-t  md:min-h-screen
                   data-[collapsed=true]:py-0 z-50  ">
            
            <!-- Logo (desktop only) -->
            <a class="sptfyin-logo hidden md:flex size-16 items-center justify-center mx-auto my-4" href="/">
                <img src={logo} alt="Sptfyin Logo" class="h-full w-full" />
            </a>

            <!-- Navigation -->
            <nav class="flex md:grid md:gap-2 justify-evenly md:justify-start items-center py-1 pb-2  px-1 md:px-2
                        group-[[data-collapsed=true]]:md:justify-center">
                {#each routes.filter(route => route.visible) as route}
                    <Tooltip.Root openDelay={0}>
                        <Tooltip.Trigger asChild >
                            {#snippet children({ builder })}
                                                <Button
                                    href={route.label}
                                    variant={route.variant}
                                    size="icon"
                                    class="size-14 md:size-20
                                    hover:bg-secondary/80
                                    hover:outline-primary
                                    hover:inverseShadow
                                    {
                                        isActive(route.label)
                                            ? ' bg-background/40 md:bg-background/60 md:text-foreground md:hover:text-background md:hover:bg-primary/90 md:hover:highlight inverseShadow'
                                            : route.variant === 'default'
                                                ? 'dark:bg-muted dark:text-muted-foreground dark:hover:bg-secondary/40  highlightCard'
                                                : ''
                                    }
                                    flex flex-col items-center justify-center no-underline md:gap-1 gap-0 w-full px-2 md:px-0 rounded-md md:rounded-md
                                    "
                                >
                                    <route.icon class="size-6 md:size-8" aria-hidden="true" />
                                    <span class="text-xs no-underline md:inline-block hidden">{route.title}</span>
                                </Button>
                                                                        {/snippet}
                                        </Tooltip.Trigger>
                        <Tooltip.Content side="top" class="flex items-center gap-4">
                            {route.title}
                        </Tooltip.Content>
                        <Tooltip.Content side="right" class="flex items-center gap-4">
                            {route.title}
                            {#if route.label}
                                <span class="text-muted-foreground ml-auto">
                                    {route.label}
                                </span>
                            {/if}
                        </Tooltip.Content>
                    </Tooltip.Root>
                {/each}
            </nav>
        </div>
        <main class="flex-1 h-screen overflow-y-auto max-w-full sm:overflow-y-hidden overflow-x-hidden md:pl-0 md:py-4 md:pr-4 md:rounded-lg selection:bg-primary selection:text-background">
           
            {@render children?.()}
        </main>
    </div>
