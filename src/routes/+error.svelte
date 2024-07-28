<script>
    import { page } from '$app/stores';
    // fetch from https://http.cat/status/ and



</script>

<div class="flex flex-col min-h-screen align-middle justify-center items-center text-center">
    <h1 class="text-4xl font-jak-display text-primary m-2">{$page.status}</h1>
    <img src='https://http.cat/{$page.status}' alt="Error Cat {$page.status}" class="rounded-sm m-4" width="600" height="400">
    <p class="text-lg">{@html $page.error.message}</p>
</div>