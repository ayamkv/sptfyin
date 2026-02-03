## **Dev Task List — Free Account Plan**

Current Stack:

- Svelte 5
- Sveltekit
- Pocketbase + Pocketbase JS SDK
- Shadcn-Svelte (Tailwindcss)

Available fields for Pocketbase Collections like `random_shorts` and `users` are available in
`src\lib\dev_task`

- `users.json`
- `random_shorts.json`

Docs is available for

- Pocketbase
- Svelte + Sveltekit

Currently all generated links have a field of author/ `users`, and they're all empty
and that's fine we will keep supporting creating links without an account created, but just limited, below tasks are for Users who decide to make an account (OPTIONAL).

- Do not limit the main page OR `/s` route just for logged in users, it will still be available

MAIN FOCUS would be to implement Feature 1 & 2

Our future plan will be to later have different tier of account,
With payment system(but thats for later)

---

### **GitHub Issues Reference**

| Issue | Title | Status | Priority |
|-------|-------|--------|----------|
| #3 | Account and Link MGMT | In Progress | HIGH |
| #11 | Allow spotify.link | DONE | MEDIUM |
| #16 | Move to Cloudflare D1/KV | Backlog | LOW |
| #18 | Link preview | DONE (Microlink integrated) | - |
| #21 | Advanced Analytics | Backlog | LOW |

---

### **1. Account Features**

**Backend**

- [x] Implement **Spotify OAuth** login flow.
- [ ] Reserve `/u/[username]` route for future public profile page. (after creating the account)
- Fields available on user from pocketbase is in `src\lib\dev_task\users.json`

**Frontend**

- [x] Add **Login with Spotify** button to auth page.
- [x] Add username setup step after first login.
- [x] Redirect to dashboard after login.

---

### **2. Link Management (General)**

**Backend**

- [x] Implement API for:
  - [x] **TEST** Creating links with the `users` field filled,
  - [x] **TEST** Fetching all links for the logged-in user. (by filtering)
  - [x] Allow Logged In users to update link destination.
  - [x] Changing slug (check uniqueness).
  - [x] **DELETE** link endpoint with ownership verification

**Frontend**

- [x] Dashboard page with list of user's created links.
- [x] Edit button (inline edit or modal for destination + slug).
- [x] Delete link functionality (in edit dialog, edit mode only)
- [x] Pagination with "Load More" button (50 items per page)
- [x] Quick stats display (view count badge on each card using `utm_view` field)

**Additional implemented:**

- [x] Navbar dashboard icon with auth redirect
- [x] Turnstile widget in dashboard creation
- [x] User avatar and profile display
- [x] First-login username confirmation flow
- [x] **REDESIGNED** Dashboard with simplified UI focusing on link management
- [x] **REDESIGNED** Create link function moved to modal dialog triggered by plus button
- [x] **FIXED** Create link functionality now works properly with error handling
- [x] **FIXED** Proper error dialogs like main page implementation
- [x] **IMPROVED** Better UX with copy/open buttons for each link
- [x] **IMPROVED** Clean layout with user info header and organized link list

**Recent Updates (Latest Session):**

- [x] **FIXED** Chaotic dual edit system - replaced with clean dialog/drawer approach
- [x] **FIXED** ReferenceError: editingItems is not defined - cleaned up conflicting code
- [x] **IMPROVED** Edit mode toggle converted from button to switch component
- [x] **IMPROVED** Responsive grid layout - 3 columns on lg screens, single column on mobile
- [x] **IMPROVED** Enhanced styling with better spacing and visual hierarchy
- [x] **IMPROVED** Mobile-responsive interface with drawer for touch devices
- [x] **IMPROVED** Non-intrusive editing that doesn't shift layout
- [x] **IMPROVED** Pre-generation of URLs for faster link creation
- [x] **IMPROVED** Smart paste functionality with URL extraction
- [x] **IMPROVED** Regex filtering for slugs and protected routes validation

**Latest Updates (Current Session - August 13, 2025):**

- [x] **MIGRATED** Full Svelte 5 runes migration - converted all let/export to $state/$props/$derived
- [x] **UPGRADED** MediaQuery responsive breakpoints using Svelte 5 reactivity with fallback
- [x] **ENHANCED** Microlink.io API integration for Spotify URL previews in create/edit dialogs
- [x] **ENHANCED** Real-time URL preview generation with thumbnail, title, subtitle, and content type detection
- [x] **ENHANCED** Link list previews with accent color extraction for visual appeal
- [x] **ENHANCED** Spotify avatar fetching using Microlink API with Dicebear fallback
- [x] **IMPROVED** Responsive dialog/drawer system - desktop uses Dialog, mobile uses Drawer
- [x] **IMPROVED** Enhanced paste functionality for both create and edit modes with clipboard API
- [x] **IMPROVED** Advanced slug sanitization with real-time validation and protected routes checking
- [x] **IMPROVED** Edit functionality now fully working with API integration and proper error handling
- [x] **IMPROVED** Increased pagination limit from 20 to 50 items per page for better UX
- [x] **ENHANCED** Loading states and skeleton placeholders for previews and avatars
- [x] **ENHANCED** Batch preview fetching to avoid API rate limits (3 concurrent requests with 200ms delays)
- [x] **ENHANCED** Visual accent color sidebar from Spotify content thumbnails
- [x] **IMPROVED** Dialog backdrop blur effects and refined UI polish
- [x] **FIXED** Switch component styling refinements for better visual consistency

**Technical Improvements:**

- [x] **MIGRATED** from `export let` to `const { prop } = $props()` pattern
- [x] **MIGRATED** from `let variable` to `let variable = $state()` for reactive state
- [x] **MIGRATED** from computed properties to `$derived()` runes
- [x] **IMPLEMENTED** Proper Svelte 5 event handling and reactivity patterns
- [x] **IMPLEMENTED** MediaQuery API with graceful fallback for responsive breakpoints
- [x] **IMPLEMENTED** Comprehensive error handling for API failures and network issues
- [x] **IMPLEMENTED** Smart content type detection for Spotify URLs (track, album, playlist, artist, etc.)

---

### **3. Playlist Link Creation**

**Backend**

- [ ] Fetch user playlists from Spotify API (after OAuth).
- [ ] Allow creating short links from selected playlists.

**Frontend**

- [ ] "Import from Spotify" modal in dashboard.
- [ ] List playlists with checkbox/select.
- [ ] Button to generate short links for selected playlists.

---

### **4. Public Profile Pages**

**Backend**

- [ ] Public profile endpoint `/u/{username}`:
  - [ ] Fetch/show user's links.
  - [ ] Apply watermark flag for free tier.

**Frontend**

- [ ] Profile page template (basic theme).
- [ ] Watermark always visible for free tier.

---

### **5. Bulk Management (Limited)**

**Backend**

- [ ] Create bulk add API:
  - [ ] Accept up to **3 links per request** for free plan users.
  - [ ] Reject if more than limit.

- [x] Create bulk delete API:
  - [x] Accept up to **5 link IDs per request**.
  - [x] Reject if more than limit.

**Frontend**

- [ ] Bulk add UI (form or CSV disabled for free tier).
- [x] Bulk delete UI with multi-select checkboxes (visible in edit mode).
- [x] Show error toast if user exceeds free-tier limit.

---

### **6. Dashboard Enhancements (Future)**

**UI/UX Improvements**

- [ ] Adjust date icon alignment to center with text
- [ ] Add QR code button next to copy button for each link
- [x] ~~Add delete button/icon in edit popup dialog~~ **COMPLETED**
- [ ] Add sorting system (Newest to Oldest, Slug A-Z, and vice versa)
- [x] ~~Add thumbnail preview for each link using color stripe from thumbnail palette~~ **COMPLETED**
- [ ] Implement infinite scroll for large link collections (currently using Load More)

**Navigation & Interaction**

- [ ] Redirect to `/[slug]/s` route when clicking stats icon on each link in dashboard
- [x] ~~Integrate microlink.hq API for thumbnail generation~~ **COMPLETED**

**Technical Notes**

- [x] ~~Microlink.hq API integration for thumbnail previews~~ **COMPLETED**
- [x] ~~Color palette extraction from thumbnails for visual indicators~~ **COMPLETED**
- [ ] Infinite scroll implementation to replace current pagination

---

### **7. spotify.link URL Support (Issue #11) - COMPLETED**

**Problem:** Mobile Spotify share links now use shortened format (`spotify.link/xyz`) which redirects through `spotify.app.link` to `open.spotify.com`.

**Backend**

- [x] Create URL expansion API endpoint (`/api/expand-url`)
- [x] Follow redirect chain: `spotify.link` → `spotify.app.link` → `open.spotify.com`
- [x] Validate final URL is legitimate Spotify URL before saving

**Frontend**

- [x] Update `findUrl()` in `src/lib/utils.js` to detect spotify.link domains
- [x] Auto-expand spotify.link URLs before saving to database
- [x] Show expanded URL in preview after expansion
- [x] Add `isSpotifyShortLink()` helper function
- [x] Add loading state ("Expanding link...") while resolving
- [x] Disable input fields during expansion
- [x] Toast notifications for success/failure

**Technical Implementation:**

- Server-side redirect following with HEAD/GET fallback
- Security: Whitelist validation (`open.spotify.com`, `spotify.com`)
- Timeout protection (10s) and max redirects (10)
- Works in both main page and dashboard (create + edit modes)

---

### **8. Advanced Analytics (Issue #21) - Backlog**

**Features Requested:**

- [ ] Referrer tracking (where traffic is coming from)
- [ ] Geo heatmaps (not just countries, but aggregated region/city)
- [ ] UTM parameter support (to measure campaign success)
- [ ] Click timeline graph (to see when spikes happen)
- [ ] Export data to CSV

---

### **9. Cloudflare D1/KV Migration (Issue #16) - Backlog**

**Goal:** Move from PocketBase to Cloudflare D1 for zero VM cost.

**Phase 1 - Data Migration:**

- [ ] Export `data.db` from `pb_data`
- [ ] Use sqlite3 CLI to dump database
- [ ] Clean up dump file (remove transactions if needed)
- [ ] Import to D1 via wrangler CLI

**Phase 2 - Code Rewrite:**

- [ ] Rewrite all CRUD logic (consider Drizzle ORM)
- [ ] Rethink Turnstile verification (currently via PB Hooks)
- [ ] Update analytics tracking

---

### **10. Changelog / Version System - Backlog**

**Goal:** Let visitors know what's new on the site.

**Ideas:**

- [ ] Public changelog page (`/changelog` or `/updates`)
- [ ] Version number display in footer or about page
- [ ] "What's New" modal/banner for returning users
- [ ] Markdown-based changelog file for easy updates
- [ ] Consider using GitHub releases as source of truth

---

### **11. Local Development Setup - COMPLETED**

**Goal:** Proper local dev environment with isolated PocketBase instance.

- [x] Create `pocketbase/` directory with hooks and migrations
- [x] Create `start-dev.bat` for Windows with env vars
- [x] Create `DEVELOPMENT.md` setup guide
- [x] Configure Turnstile test keys for local dev
- [x] Update `.gitignore` for pb_data and binaries
- [x] Pin to PocketBase v0.23.12 to match production

---

### **Session Log - January 31, 2026**

**Features Implemented:**

- [x] Bulk delete UI (checkboxes on cards, Select All, max 5 limit)
- [x] Bulk delete API endpoint (`/api/links/bulk`)
- [x] Local PocketBase dev environment setup
- [x] Security fix: CREATE endpoint now uses server-side user ID only
- [x] Security fix: Allow owners to update subdomain field in pb_hooks
- [x] **spotify.link support (Issue #11)** - Auto-expand mobile share links

**Files Created:**

- `DEVELOPMENT.md` - Local dev setup guide
- `pocketbase/start-dev.bat` - Windows startup script with env vars
- `pocketbase/pb_hooks/` - Copied from VPS backup
- `pocketbase/pb_migrations/README.md` - Instructions for schema import
- `src/routes/api/links/bulk/+server.js` - Bulk delete endpoint
- `src/routes/api/expand-url/+server.js` - URL expansion for spotify.link

**Files Modified for spotify.link:**

- `src/lib/utils.js` - Added `isSpotifyShortLink()`, updated `findUrl()`
- `src/routes/+page.svelte` - Main page expansion support
- `src/routes/dash/links/+page.svelte` - Dashboard expansion support

---
