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

**Frontend**

- [x] Dashboard page with list of user's created links.
- [x] Edit button (inline edit or modal for destination + slug).
- [ ] Pagination or infinite scroll if needed.

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

- [ ] “Import from Spotify” modal in dashboard.
- [ ] List playlists with checkbox/select.
- [ ] Button to generate short links for selected playlists.

---

### **4. Public Profile Pages**

**Backend**

- [ ] Public profile endpoint `/u/{username}`:
  - [ ] Fetch/show user’s links.
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

- [ ] Create bulk delete API:
  - [ ] Accept up to **5 link IDs per request**.
  - [ ] Reject if more than limit.

**Frontend**

- [ ] Bulk add UI (form or CSV disabled for free tier).
- [ ] Bulk delete UI with multi-select checkboxes.
- [ ] Show error toast if user exceeds free-tier limit.

---

### **6. Dashboard Enhancements (Future)**

**UI/UX Improvements**

- [ ] Adjust date icon alignment to center with text
- [ ] Add QR code button next to copy button for each link
- [ ] Add delete button/icon in edit popup dialog
- [ ] Add sorting system (Newest to Oldest, Slug A-Z, and vice versa)
- [x] ~~Add thumbnail preview for each link using color stripe from thumbnail palette~~ **COMPLETED**
- [ ] Implement infinite scroll for large link collections

**Navigation & Interaction**

- [ ] Redirect to `/s/[slug]` route when clicking each link in dashboard
- [x] ~~Integrate microlink.hq API for thumbnail generation~~ **COMPLETED**

**Technical Notes**

- [x] ~~Microlink.hq API integration for thumbnail previews~~ **COMPLETED**
- [x] ~~Color palette extraction from thumbnails for visual indicators~~ **COMPLETED**
- [ ] Infinite scroll implementation to replace current pagination

---
