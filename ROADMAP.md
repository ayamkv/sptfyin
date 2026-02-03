# sptfy.in Product Roadmap & Monetization Plan

**Last Updated:** February 2025  
**Status:** Approved - Ready for Implementation

> **Payment Provider Decision:** Paddle (confirmed for Indonesia availability, merchant of record, subscription management)

---

## Executive Summary

sptfy.in will transition from a completely free service to a **freemium model** with three tiers: Guest (anonymous), Free (account-based), and Pro (paid subscription). This roadmap outlines feature differentiation, pricing strategy, technical implementation, and phased rollout.

**Target Market:**

- **Free Users**: Hobbyists, casual Spotify users, indie musicians
- **Pro Users**: Playlist curators, digital marketers, musicians/artists, content creators

---

## Tier Structure

### 1. Guest Plan (Anonymous - No Account)

**Positioning**: Entry-level, highly limited to encourage account creation

| Feature              | Limitation                                       |
| -------------------- | ------------------------------------------------ |
| **Dashboard Access** | ❌ No access                                     |
| **Link Creation**    | ✅ Unlimited with strict rate limiting           |
| **Bulk Operations**  | ❌ No bulk add, delete, or CSV                   |
| **Analytics**        | ⚠️ Logs only 5 clicks total per link, basic view |
| **Custom Domains**   | ❌ Not available                                 |
| **Public Profile**   | ❌ Not available                                 |
| **API Access**       | ❌ Not available                                 |

**Rate Limits:**

- 5 links per hour per IP
- 20 links per day per IP

---

### 2. Free Plan (Account Required)

**Positioning**: Core functionality for engaged users, gateway to Pro

| Feature               | Limitation                                            |
| --------------------- | ----------------------------------------------------- |
| **Dashboard Access**  | ✅ Full access                                        |
| **Link Count**        | ✅ Unlimited (relaxed rate limits)                    |
| **Bulk Add**          | ✅ Up to 3 links per operation                        |
| **Bulk Delete**       | ✅ Up to 3 links per operation                        |
| **CSV Import/Export** | ❌ Not available                                      |
| **Analytics**         | ✅ Basic analytics (views, referrers, 30-day history) |
| **Custom Domain**     | ✅ 1 subdomain (e.g., `artist.sptfy.in/your-link`)    |
| **Public Profile**    | ✅ Available with watermark                           |
| **API Access**        | ❌ Not available                                      |

**Rate Limits:**

- 30 links per hour
- 100 links per day

**Watermarked Features:**

- Public profile shows "Created with sptfy.in Free" badge
- QR codes include small watermark

---

### 3. Pro Plan (Paid Subscription)

**Pricing:**

- **Monthly**: $5 USD/month
- **Annual - Early Supporter**: $10 USD/year (83% savings, ~$0.83/month) - Limited time offer
- **Annual - Regular**: $15 USD/year (75% savings, ~$1.25/month)

> **Note:** Early Supporter pricing is available for the first 100 Pro subscribers or until public launch, whichever comes first.

**Positioning**: Power users, professionals, marketers

| Feature               | Details                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| **Dashboard Access**  | ✅ Full access with priority loading                                                           |
| **Link Count**        | ✅ Unlimited (highest rate limits)                                                             |
| **Bulk Add**          | ✅ Up to 50 links per operation                                                                |
| **Bulk Delete**       | ✅ Up to 50 links per operation                                                                |
| **CSV Import/Export** | ✅ Template-based CSV import/export                                                            |
| **Analytics**         | ✅ Advanced analytics (referrers, geo heatmaps, UTM tracking, click timelines, 1-year history) |
| **Custom Domain**     | ✅ Up to 3 custom subdomains                                                                   |
| **Public Profile**    | ✅ Clean, no watermark                                                                         |
| **API Access**        | ✅ REST API with API keys (1000 requests/day)                                                  |
| **Support**           | ✅ Priority support (24-48h response)                                                          |
| **Early Access**      | ✅ Beta features access                                                                        |

**Rate Limits:**

- 100 links per hour
- 500 links per day

---

## Feature Comparison Matrix

| Feature            | Guest                     | Free             | Pro                 |
| ------------------ | ------------------------- | ---------------- | ------------------- |
| Link Creation      | Unlimited (strict limits) | Unlimited        | Unlimited           |
| Dashboard          | ❌                        | ✅               | ✅                  |
| Bulk Add           | ❌                        | 3 links          | 50 links            |
| Bulk Delete        | ❌                        | 3 links          | 50 links            |
| CSV Import         | ❌                        | ❌               | ✅                  |
| CSV Export         | ❌                        | ❌               | ✅                  |
| Basic Analytics    | 5 clicks only             | ✅               | ✅                  |
| Advanced Analytics | ❌                        | ❌               | ✅                  |
| Custom Subdomain   | ❌                        | 1 (watermarked)  | 3 (clean)           |
| Public Profile     | ❌                        | ✅ (watermarked) | ✅ (clean)          |
| API Access         | ❌                        | ❌               | ✅                  |
| Priority Support   | ❌                        | ❌               | ✅                  |
| **Price**          | Free                      | Free             | $5/mo or $10/$15/yr |

---

## Technical Implementation Plan

### Phase 1: Database Schema Updates

**Users Collection Modifications:**

```javascript
// New fields to add to users collection
{
  "plan_tier": "enum(guest, free, pro)",  // default: free (for oauth users)
  "subscription_status": "enum(active, cancelled, past_due, unpaid)",
  "subscription_start": "datetime",
  "subscription_end": "datetime",
  "paddle_subscription_id": "string",
  "paddle_customer_id": "string",
  "custom_domains": "number",  // count of custom domains used
  "api_key": "string",  // encrypted, for Pro users
  "rate_limit_tier": "enum(guest, free, pro)"  // separate from plan for flexibility
}
```

**Links Collection (random_short):**

```javascript
// Existing fields work, but add tracking
{
  "plan_tier_at_creation": "enum(guest, free, pro)",  // for analytics
  "analytics_retention_days": "number"  // 5 (guest), 30 (free), 365 (pro)
}
```

### Phase 2: Payment Integration (Paddle)

**Why Paddle?**

- ✅ Available in Indonesia
- ✅ Handles tax/VAT compliance globally
- ✅ Merchant of record (they handle chargebacks, disputes)
- ✅ Simple checkout experience
- ✅ Webhook support for subscription events

**Implementation:**

1. Set up Paddle account and products (Monthly/Annual plans)
2. Implement Paddle Checkout overlay/checkout.js
3. Webhook handlers for:
   - `subscription.created`
   - `subscription.updated` (upgrades/downgrades)
   - `subscription.cancelled`
   - `payment.succeeded`
   - `payment.failed`

**Subscription Flow:**

```
User clicks "Upgrade to Pro"
→ Paddle Checkout (overlay or redirect)
→ Payment success
→ Webhook updates user.plan_tier = "pro"
→ User redirected to success page
→ Dashboard shows Pro features unlocked
```

### Phase 3: Feature Gating Implementation

**Approach: Middleware + Component-level checks**

**1. Server-side Middleware (hooks/routes):**

```javascript
// In API endpoints, check plan tier
function checkPlanAccess(user, requiredTier) {
	const tiers = { guest: 0, free: 1, pro: 2 };
	if (tiers[user.plan_tier] < tiers[requiredTier]) {
		throw new Error(`This feature requires ${requiredTier} plan`);
	}
}
```

**2. Frontend Component Gating:**

```svelte
{#if $userStore.plan_tier === 'pro'}
	<CsvImportButton />
{:else}
	<ProFeatureTeaser feature="csv-import" />
{/if}
```

**3. Rate Limiting by Tier:**

- Implement tier-based rate limits in `pb_hooks/random.pb.js`
- Use Paddle customer ID or user ID for tracking

### Phase 4: Analytics Implementation

**Data Retention Strategy:**

- Guest: Aggregate only, keep 5 most recent clicks
- Free: 30-day rolling window, basic aggregation
- Pro: 1-year retention, raw data + aggregations

**Analytics Types:**

1. **Basic** (Free): Views, unique visitors, referrers (top 5), countries
2. **Advanced** (Pro):
   - Full referrer tracking
   - Geo heatmaps (city-level)
   - UTM parameter tracking
   - Click timeline graphs
   - Device/browser breakdown
   - Export to CSV

---

## API Design (Pro Feature)

**Authentication:** API Key in header `X-API-Key: your_key_here`

**Endpoints:**

```
POST   /api/v1/links          # Create short link
GET    /api/v1/links          # List user's links (paginated)
PATCH  /api/v1/links/:id      # Update link destination/slug
DELETE /api/v1/links/:id      # Delete link
POST   /api/v1/links/bulk     # Bulk create (max 50)
GET    /api/v1/analytics/:id  # Get analytics for link
```

**Rate Limits:**

- 1000 requests/day per API key
- 100 requests/minute burst limit

---

## Pricing Strategy & Psychology

### Why $5/month and $10/$15/year?

**$5/month:**

- Sweet spot for perceived value - not "cheap" but accessible
- Drives users toward annual plan (better value)
- Professional price point for serious users
- Still competitive with Bitly ($8/mo) while offering more value

**$10/year - Early Supporter:**

- Limited offer for first 100 subscribers or pre-launch users
- Creates urgency and rewards early adopters
- 83% discount feels like an exclusive deal
- Builds initial user base and social proof

**$15/year - Regular:**

- Still excellent value at 75% off monthly
- ~$1.25/month is less than a coffee
- Sustainable pricing for long-term viability
- Clear upgrade from Early Supporter ($10→$15 shows value)

**Psychology:**

- $5 monthly pushes users to evaluate annual seriously
- Early Supporter creates FOMO (fear of missing out)
- Price anchoring: $5 vs $10 makes Early Supporter feel like a steal
- Early adopters become advocates with locked-in low price

---

## Launch Strategy

### Phase 1: Foundation (Month 1-2)

- [ ] Implement Guest plan restrictions (no dashboard, limited analytics)
- [ ] Add Paddle integration for Pro subscriptions
- [ ] Update user schema with plan fields
- [ ] Implement tier-based rate limiting
- [ ] Feature gate bulk operations (3 vs 50)

### Phase 2: Pro Features (Month 3-4)

- [ ] Build advanced analytics dashboard
- [ ] Implement CSV import/export
- [ ] Create API system with keys
- [ ] Public profile improvements (watermark toggle)
- [ ] Custom subdomain management (up to 3)

### Phase 3: Launch & Iterate (Month 5+)

- [ ] Soft launch to existing users
- [ ] Gather feedback and adjust limits
- [ ] Add more Pro features based on demand
- [ ] Consider Team/Agency tier if needed
- [ ] Affiliate/referral program for Pro

---

## Success Metrics

**Conversion Goals:**

- 5% of active Free users convert to Pro within 6 months
- 70% of Pro users choose Annual plan
- <5% monthly churn rate

**Key Metrics to Track:**

1. Conversion rate: Free → Pro
2. Churn rate by plan
3. Feature usage (which Pro features are most used?)
4. Support ticket volume (prioritize Pro tickets)
5. Revenue per user (RPU)
6. Lifetime value (LTV)

---

## Risk Mitigation

**Risks & Solutions:**

1. **Stripe not available in Indonesia**
   - ✅ Mitigated: Using Paddle (available in Indonesia)

2. **Users angry about free tier restrictions**
   - Solution: Grandfather existing links, only apply to new
   - Clear communication 30 days before changes
   - Offer "early adopter" discount for first 100 Pro users

3. **Payment processing issues**
   - Solution: Paddle handles disputes/compliance
   - Backup: Consider LemonSqueezy as fallback

4. **Technical complexity of feature gating**
   - Solution: Start simple, middleware checks only
   - Iterate on gating as needed

---

## Open Questions

1. **Guest to Free conversion:** Should we require email verification for Free accounts?
2. **Free tier limits:** Are 3 bulk links too restrictive? Should it be 5?
3. **Pro API limits:** 1000 requests/day - too high or too low?
4. **Trial period:** Should Pro have a 7-day free trial?
5. **Refund policy:** 7-day money-back guarantee?
6. **Team accounts:** Should we support multiple users under one Pro account?

---

## Next Steps

1. **Review & approve this roadmap**
2. **Create beads issues for implementation phases**
3. **Set up Paddle account and product configuration**
4. **Design UI for plan selection and upgrade prompts**
5. **Begin Phase 1 development** (Guest plan restrictions)

---

**Document Owner:** @ayamkv  
**Review Date:** Monthly until launch  
**Status:** Approved - Implementation in Progress
