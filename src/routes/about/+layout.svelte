<script>
import 'iconify-icon'
import { fly } from 'svelte/transition'
import { page } from '$app/stores'

const navItems = [
    {
      href: "/about/general",
      label: "what's sptfyin?",
      icon: "lucide:message-circle-question"
    },
    {
      href: "/about/privacy",
      label: "privacy policies",
      icon: "lucide:lock"
    },
    {
      href: "/about/terms",
      label: "terms and ethics",
      icon: "lucide:file-check-2"
    },
    {
      href: "/about/socials",
      label: "socials",
      icon: "lucide:at-sign"
    }
  ]
let showNav = false
  
</script>

{#if (!showNav)}
<button 
  class="fixed top-4 left-4 z-50 bg-primary text-background p-2 rounded-lg flex items-center justify-center lg:hidden md:left-28 w-10 h-10 highlight"
   on:click={() => showNav = true}>
   <iconify-icon icon='lucide:chevron-left' width="24" class="w-[24px] h-[24px]"></iconify-icon>
</button>
{/if}

{#if showNav}
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" on:click={() => showNav = false} in:fly={{ x:-200, duration: 100 }} out:fly={{ x:-200, duration: 100 }}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed left-0 top-0 h-full w-72 bg-background border-r p-6 md:left-28" on:click|stopPropagation>
    <button 
      class="absolute top-4 right-4 bg-primary text-background p-2 rounded-lg flex items-center justify-center"
      on:click={() => showNav = false}>
      <iconify-icon icon='lucide:x' width="24"></iconify-icon>
    </button>
    <div class="nav-container flex flex-col gap-4 w-46 mt-16">
      <div class="nav-header text-4xl">
        about
      </div>
      <div class="navigation-bar">
        <nav class="subnav flex flex-col gap-4">
            {#each navItems as nav}
              <a href={nav.href} class="flex flex-row gap-2 align-center justify-start p-2 rounded-lg hover:text-white hover:bg-secondary/40 hover:outline-2 hover:outline-primary 
              {$page.url.pathname === nav.href ? 'bg-primary text-background font-bold hover:bg-primary/80' : 'font-thin'} ">
                  <div class="icon bg-primary text-background p-2 rounded-lg w-12 h-12 flex items-center justify-center">
                    <iconify-icon icon={nav.icon} width="32"  class="text-2xl w-8 h-8"></iconify-icon>
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

<div class="container grid md:grid-cols-6 grid-rows-1 gap-4 mt-16">
<div class="nav-container lg:flex flex-col gap-4 w-46 px-4 hidden">
    <div class="nav-header text-4xl">
        about
    </div>
    <div class="navigation-bar">
        <nav class="subnav flex flex-col gap-4 lg:col-span-1">
            {#each navItems as nav}
              <a href={nav.href} class="flex flex-row gap-2 align-center justify-start p-2 rounded-lg hover:text-white hover:bg-secondary/40 hover:outline-2 hover:outline-primary 
              {$page.url.pathname === nav.href ? 'bg-primary text-background font-bold hover:bg-primary/80' : 'font-thin'} ">
                  <div class="icon bg-primary text-background p-2 rounded-lg w-12 h-12 flex items-center justify-center">
                    <iconify-icon icon={nav.icon} width="32"  class="text-2xl w-8 h-8"></iconify-icon>
                  </div>
                  <span class="">{nav.label}</span>
              </a>
            {/each}
          </nav>
    </div>
</div>

<div class="content-container col-span-5">
    <slot />
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
          overflow: hidden;
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