<script>
  import * as Card from '$lib/components/ui/card';
  import { Button } from '$lib/components/ui/button';
</script>

<div class="mt-0 flex md:min-h-[80vh] flex-col items-center justify-center">
  <div class="logo mt-[2em] flex flex-col items-center justify-center">
    <h1 class="ss03 font-jak-display text-2xl font-bold text-primary lg:block lg:text-6xl">Sptfy.in</h1>
  </div>

  <Card.Root class="w-[23rem] lg:w-[25rem] mt-6">
    <Card.Content class="grid gap-4 pb-6 pt-6">
      <h2 class="text-xl font-semibold">Sign in</h2>
      <a href="/auth/spotify">
        <Button class="w-full">Login with Spotify</Button>
      </a>
      <p class="text-xs text-foreground/60">You’ll be redirected to Spotify and then back here.</p>
    </Card.Content>
  </Card.Root>
</div>


