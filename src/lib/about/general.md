# frequently asked questions

last updated: 2026-02-27

## sptfyin, what's that?

[sptfyin](/) is a spotify-only link shortener.
you paste a spotify url, get a short link, and share it anywhere.

## what links are supported?

we support spotify links only (tracks, albums, playlists, artists, podcasts, and related spotify content).

## can i use custom slugs and subdomains?

yes. you can use a custom back-half (slug) when available, and choose from branded `*.sptfy.in` subdomains.

## how can i view my link statistics and qr code?

add `/s` to your short url:

| your short url                               | stats url                                        |
| -------------------------------------------- | ------------------------------------------------ |
| [sptfy.in/raharja](https://sptfy.in/raharja) | [sptfy.in/raharja/s](https://sptfy.in/raharja/s) |

that page includes basic stats and the qr preview for the same link.

## can i replace or change the spotify link in my created short url?

right now, this is planned for broader self-serve management.
if you need urgent changes, contact us via [our socials](/@/about/socials) and include proof of ownership.

## can i delete my url?

if you created the link as a guest (without signing in), you can delete your active local links directly from the homepage after completing a quick Turnstile verification.

for links outside your active local window, or if you've lost access to the original browser session, deletion requests are handled manually with ownership verification. please contact [our socials](/@/about/socials) with proof of ownership.

## how do guest links work?

when you shorten a link without signing in, sptfyin creates a private guest session tied to your current browser and device via a secure cookie. this lets you see and manage your recent links in the "my links" tab on the homepage.

**what you can do as a guest:**

- create unlimited short links (subject to rate limits)
- see your 3 newest active links in the "my links" tab
- delete any of those 3 active links after Turnstile verification
- copy, share, and view QR codes for all your links

**rolling active window:**

the "my links" tab only shows your 3 most recent active guest links. when you create a 4th link, the oldest one rolls out of your local list. rolled-out links still redirect normally — they're not deleted — but you can no longer delete them from the UI.

**important limitations:**

- clearing your browser cookies or storage will lose access to your local guest links
- switching devices or browsers means you won't see those links in "my links"
- there's no way to recover a lost guest session at this time
- guest links are not tied to any account system yet (this may change in the future)

if you need permanent, cross-device access to your links, consider signing in when account features become available.

## will my links ever expire?

nope. short links do not have an automatic expiration policy at the moment.

## how many urls can i create?

there is no fixed quota, but rate limits are applied to prevent abuse.

## what is currently planned?

- deeper analytics views
- stronger link management workflows
- improved qr customization

## have other questions?

reach out through [our socials](/@/about/socials) or email [hello@sptfy.in](mailto:hello@sptfy.in).
