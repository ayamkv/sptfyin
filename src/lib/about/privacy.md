# privacy policy

last updated: 2026-06-02

## 1. overview

at [sptfy.in](/), we collect only the data needed to run and protect a spotify link shortener.
this page explains what we collect, why we collect it, and how you can contact us.

## 2. information we collect

### 2.1 link data

- original spotify url
- generated short url and slug
- selected `*.sptfy.in` subdomain

### 2.2 redirect and usage data

when someone opens a short link, we automatically collect:

- click events and aggregate counts
- user agent string
- country-level location (from request metadata)
- referrer (when available)

### 2.3 account data

if you sign in, we process account-related data needed for authentication and link management. this may include your account id, username, email address, avatar, oauth provider, and provider id, depending on what google or discord returns through oauth.

we use this data to keep you signed in, show account controls, and connect links to your account.

### 2.4 guest session data

when you create links without signing in, we set a private guest session cookie in your browser. this cookie contains a secure secret that lets us identify which links you created locally, so you can see and manage them in the "my links" tab.

the guest cookie is:

- stored only in your browser (not shared across devices)
- used solely to remember your locally created links
- deleted if you clear your browser cookies or storage
- not linked to any account unless you sign in while that guest session still exists

if you sign in while a guest session cookie is present, sptfyin may transfer links from that guest session into your account and then clear the guest cookie.

### 2.5 authentication cookies and local storage

when you sign in, sptfyin uses authentication cookies to keep your session active. these cookies are needed for login, dashboard access, and account-linked link management.

the app may also use local storage for small interface state, cached homepage data, and update notices. local storage stays in your browser unless you clear it.

## 3. how we use information

we use data to:

- operate redirects and link management features
- provide analytics views for created links
- authenticate accounts through google or discord oauth
- transfer guest links into an account when you sign in from the same browser session
- detect abuse, bots, and suspicious traffic
- monitor reliability and improve service quality

## 4. data security

we apply practical security controls, including access controls, environment-level secrets, and routine updates.
no system is perfect, but we continuously improve our security posture.

## 5. data sharing

we do not sell personal data.
we may disclose limited data only when required by law, or share anonymized aggregate statistics.

some data is processed by service providers that help run sptfyin, such as hosting, analytics/security infrastructure, authentication providers, and anti-abuse tooling. google and discord process oauth sign-in according to their own terms and privacy policies.

## 6. your rights

you may request:

- access to your personal data
- correction of inaccurate data
- deletion of data where applicable
- export of your data where applicable

note: short links redirect immediately, and analytics collection is part of service operation and abuse prevention. there is currently no per-click opt-out flow for visitors opening a shortened link.

## 7. contact us

for privacy-related questions or requests:

- email: [hello@sptfy.in](mailto:hello@sptfy.in)
- bluesky: [sptfy.in](https://bsky.app/profile/sptfy.in)

please use email for private privacy requests. github issues are public and should only be used for public bug reports or project feedback.
