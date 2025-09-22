<script>
	import { stopPropagation } from 'svelte/legacy';
	import 'iconify-icon';
	import { fly } from 'svelte/transition';
	import { page } from '$app/state';
	/**
	 * @typedef {Object} Props
	 * @property {import('svelte').Snippet} [children]
	 */

	/** @type {Props} */
	let { children } = $props();

	const navItems = [
		{
			href: '/about/general',
			label: "what's sptfyin?",
			icon: 'lucide:message-circle-question'
		},
		{
			href: '/about/privacy',
			label: 'privacy policies',
			icon: 'lucide:lock'
		},
		{
			href: '/about/terms',
			label: 'terms and ethics',
			icon: 'lucide:file-check-2'
		},
		{
			href: '/about/socials',
			label: 'socials',
			icon: 'lucide:at-sign'
		}
	];
	let showNav = $state(false);
</script>

{#if !showNav}
	<button
		class="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary p-2 text-foreground md:left-28 lg:hidden"
		onclick={() => (showNav = true)}
		aria-label="Open navigation"
	>
		<iconify-icon icon="lucide:align-left" width="24" class="h-[24px] w-[24px]"></iconify-icon>
	</button>
{/if}

{#if showNav}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-40 bg-background/90 lg:hidden"
		onclick={() => (showNav = false)}
		in:fly={{ x: -200, duration: 100 }}
		out:fly={{ x: -200, duration: 100 }}
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed left-0 top-0 h-full w-72 border-r bg-background p-6 md:left-28"
			onclick={stopPropagation((e) => e)}
		>
			<button
				class="absolute right-4 top-4 flex items-center justify-center rounded-lg bg-secondary p-2 text-foreground"
				onclick={() => (showNav = false)}
				aria-label="Close navigation"
			>
				<iconify-icon icon="lucide:x" width="24"></iconify-icon>
			</button>
			<div class="nav-container w-46 mt-16 flex flex-col gap-4">
				<div class="nav-header text-4xl">about</div>
				<div class="navigation-bar">
					<nav class="subnav flex flex-col gap-4">
						{#each navItems as nav}
							<a
								href={nav.href}
								class="align-center hover:inverseShadow flex flex-row justify-start gap-2 rounded-lg p-2 hover:bg-secondary/40 hover:text-white hover:outline-2 hover:outline-primary
              {page.url.pathname === nav.href
									? 'bg-primary text-background hover:bg-primary/80'
									: 'font-thin'} "
							>
								<div
									class="icon flex h-12 w-12 items-center justify-center rounded-lg bg-primary p-2 text-background"
								>
									<iconify-icon icon={nav.icon} width="32" class="h-8 w-8 text-2xl"></iconify-icon>
								</div>
								<span>{nav.label}</span>
							</a>
						{/each}
					</nav>
				</div>
			</div>
		</div>
	</div>
{/if}

<div
	class="container mx-0 grid max-h-full min-h-full min-w-full grid-rows-1 gap-4 overflow-y-hidden border border-t bg-background/40 pb-16 pt-[2rem] md:grid-cols-6 md:rounded-xl md:pb-12"
>
	<div class="nav-container w-46 hidden flex-col gap-4 px-4 lg:flex">
		<div class="nav-header text-4xl sm:hidden">about</div>
		<div class="navigation-bar">
			<nav class="subnav flex flex-col gap-4 lg:col-span-1">
				{#each navItems as nav}
					<a
						href={nav.href}
						class="align-center flex flex-row justify-start gap-2 rounded-lg p-2 hover:bg-secondary/40 hover:text-white hover:outline-2 hover:outline-primary
              {page.url.pathname === nav.href
							? 'bg-secondary text-foreground  hover:bg-primary/80'
							: 'font-thin'} "
					>
						<div
							class="icon flex h-12 w-12 items-center justify-center rounded-lg bg-primary p-2 text-background {page
								.url.pathname === nav.href
								? 'bg-secondary text-foreground hover:bg-primary/80'
								: 'font-thin'} "
						>
							<iconify-icon icon={nav.icon} width="32" class="h-8 w-8 text-2xl"></iconify-icon>
						</div>
						<span class="">{nav.label}</span>
					</a>
				{/each}
			</nav>
		</div>
	</div>

	<div class="content-container col-span-5 overflow-y-auto pb-[5rem] md:pb-0 md:pt-[2rem]">
		{@render children?.()}
	</div>
</div>

<style>
	a {
		text-decoration: none;
	}
	/* Add borders to table :global */
	.prose table {
		border-collapse: collapse;
		border-spacing: 0;
		width: 100%;

		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
	}
	:global(.prose th),
	:global(.prose td) {
		border: 1px solid var(--color-border);
		padding: 0.75rem;
	}
	:global(.prose th) {
		border: 1px solid var(--color-border);
		background-color: var(--color-secondary);
		font-weight: 600;
	}
</style>
