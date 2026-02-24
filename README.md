<img src="static/favicon.png" title="sptfyin" alt="sptfyin logo" width="100" />

# [sptfy.in](https://sptfy.in) ![GitHub deployments](https://img.shields.io/github/deployments/ayamkv/sptfyin/production)

sptfyin is a simple spotify link shortener,

paste your spotify track, album, or playlist url → slap on a custom back half (optional) → done. ✨

**no ads**, no nonsense—just short links that _actually_ work.

### why?

- strictly for spotify links. no weird redirects.

- want a cleaner url? add your own slug. or don’t. we’re not picky.

- self-hosted, no tracking, no bs

<a href="https://sptfy.in/"><img src="https://sptfy.in/prev" alt="image" border="0"></a>

## acknowledgements

shoutout to the open-source community for the tools that made this possible:

- [svelte 5](https://svelte.dev/) for the magic 🪄
- [shadcn-svelte](https://shadcn-svelte.com) for the pretty parts
- [pocketbase](https://pocketbase.io) for the backend 📁
- [plus jakarta sans](https://github.com/tokotype/PlusJakartaSans) for the clean fonts

## disclaimer

_Spotify®_ is a registered trademark of Spotify AB.  
this project is **not** affiliated with, endorsed by, or sponsored by Spotify AB.

_(TL;DR: we just like their music links, okay?)_

## infrastructure notes

- backend: PocketBase in Docker (`~/pb-docker`)
- current VPS size: 2 vCPU / 2 GB RAM / 20 GB disk
- reverse proxy: Nginx -> `127.0.0.1:8091`
- frontend: Cloudflare Pages
- status page: https://status.sptfy.in
- migration runbook: `docs/MIGRATION-RUNBOOK.md`

## license

this repository is licensed under [AGPL-3.0](https://github.com/ayamkv/sptfyin?tab=License-1-ov-file)
