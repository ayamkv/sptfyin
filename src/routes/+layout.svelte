<script>
    import "../app.css";
    import { Toaster } from "$lib/components/ui/sonner";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { Button } from "$lib/components/ui/button";
    import { Home, CircleUserRound, Library, Plus, HandHeart, Info } from "lucide-svelte";
    import { page } from "$app/stores";
    
    let isCollapsed = true;
    $: currentPath = $page.url.pathname;
    $: isActive = (routeLabel) => routeLabel === currentPath;
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
</script>

<Toaster duration={4000} position="top-center"/>

    <div class="fixed inset-0 flex md:flex-row">
        <div data-collapsed={isCollapsed}
            class="group flex flex-col bg-gradient-to-t from-[#332c4e]/80 via-card via-30% to-card text-card-foreground highlightNav
                   fixed md:static bottom-0 md:bottom-auto left-0 right-0 md:w-24
                   border-t md:border md:min-h-screen
                   data-[collapsed=true]:py-2 z-50">
            
            <!-- Logo (desktop only) -->
            <a class="sptfyin-logo hidden md:flex size-16 items-center justify-center mx-auto my-4" href="/">
                <img src='favicon.png' alt="Sptfyin Logo" class="h-full w-full shadow-lg" />
            </a>

            <!-- Navigation -->
            <nav class="flex md:grid gap-2 justify-around md:justify-start items-center py-1 pb-3 px-4 md:px-2
                        group-[[data-collapsed=true]]:justify-center">
                {#each routes.filter(route => route.visible) as route}
                    <Tooltip.Root openDelay={0}>
                        <Tooltip.Trigger asChild let:builder>
                            <Button
                                href={route.label}
                                variant={route.variant}
                                size="icon"
                                class="size-12 md:size-20 
                                hover:bg-secondary/40
                                hover:outline-primary
                                {
                                    isActive(route.label)
                                        ? 'bg-primary text-background hover:text-background hover:bg-primary/90 hover:highlight highlightCard'
                                        : route.variant === 'default'
                                            ? 'dark:bg-muted dark:text-muted-foreground dark:hover:bg-secondary/40 highlightCard'
                                            : ''
                                }
                                flex flex-col items-center justify-center no-underline gap-1
                                "
                            >
                                <svelte:component this={route.icon} class="size-6 md:size-8" aria-hidden="true" />
                                <span class="text-xs no-underline md:inline-block hidden">{route.title}</span>
                            </Button>
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
        <main class="flex-1 h-screen overflow-y-auto sm:overflow-y overflow-x-hidden sm:p-4 pb-20 md:pb-4">
            <slot />
        </main>
    </div>
