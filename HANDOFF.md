# Fairytale Farms - Agent Handoff Document

## Project Overview

**Fairytale Farms** is a full-stack e-commerce bakery website built with:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + tRPC
- **Database**: MySQL (TiDB Cloud)
- **Payments**: Stripe (currently configured, needs live keys)
- **Hosting**: Manus platform at `fairytalefarms.net`

The site is preparing for a **Valentine's Day 2026** launch with curated treat boxes.

---

## Current State

### What's Been Completed

1. **Mini Tin Images Added** (need filename fix)
   - User uploaded 3 product images for mini tin cakes
   - Files were saved with double extension `.jpg.jpg` - **NEEDS RENAMING**
   - Location: `client/public/images/`
   - Current names: `mini-tin-vanilla.jpg.jpg`, `mini-tin-chocolate.jpg.jpg`, `mini-tin-strawberry.jpg.jpg`
   - **Required names**: `mini-tin-vanilla.jpg`, `mini-tin-chocolate.jpg`, `mini-tin-strawberry.jpg`

2. **Product Image Mappings Updated**
   - File: `client/src/lib/productImages.ts`
   - Maps product slugs to correct image paths
   - Mini tin cakes now map to individual flavor images

3. **Stripe Configuration** (partially complete)
   - User has added **Live** API keys to Manus Secrets
   - Webhook endpoint created at `https://fairybakery-99tqthjg.manus.space/api/stripe/webhook`
   - **STILL NEEDED**: Add webhook signing secret (`whsec_...`) to Manus as STRIPE_WEBHOOK_SECRET Live key

4. **Database Pricing Update Script Created**
   - File: `update-valentines-pricing.mjs`
   - **HAS NOT BEEN RUN YET** - database still has old pricing
   - Script updates Valentine's tier boxes to match the flyer pricing

---

## Critical Tasks Remaining

### Task 1: Fix Mini Tin Image Filenames

```bash
cd client/public/images
mv mini-tin-chocolate.jpg.jpg mini-tin-chocolate.jpg
mv mini-tin-strawberry.jpg.jpg mini-tin-strawberry.jpg
mv mini-tin-vanilla.jpg.jpg mini-tin-vanilla.jpg
```

Then commit and push:
```bash
git add -A
git commit -m "Fix mini tin image filenames (remove double .jpg extension)"
git push origin main
```

### Task 2: Run Database Pricing Update

The database currently has **incorrect pricing** that doesn't match the user's flyer:

| Box | Current DB Price | Correct Price (Flyer) |
|-----|------------------|----------------------|
| Sweet Beginnings | $28 | Should be **Fairytale Crush Box $50** |
| Love Story | $52 | Should be **Fairytale Sweetheart Box $75** |
| Fairytale Romance | $85 | Should be **Fairytale Romance Box $100** |

**Run the update script:**
```bash
# Requires DATABASE_URL environment variable
node update-valentines-pricing.mjs
```

If DATABASE_URL is not set, use:
```bash
DATABASE_URL="mysql://3wVLnwvYiEjR9RM.58b0e4e79229:PASSWORD@gateway02.us-east-1.prod.aws.tidbcloud.com:4000/DATABASE_NAME?ssl=true" node update-valentines-pricing.mjs
```

The script will:
- Rename tier boxes to match flyer (Crush/Sweetheart/Romance)
- Update prices to $50/$75/$100
- Replace Build-Your-Own items with correct pricing
- Add strawberry add-ons ($20 half dozen, $35 dozen)

### Task 3: Verify Stripe Webhook Secret

User needs to add the webhook signing secret to Manus:
1. In Stripe Dashboard → Developers → Webhooks → Click on the webhook
2. Reveal the "Signing secret" (starts with `whsec_`)
3. In Manus → Settings → Secrets → STRIPE_WEBHOOK_SECRET → Add as **Live** key

---

## File Structure Reference

```
fairytale-farms/
├── client/
│   ├── public/images/
│   │   ├── mini-tin-vanilla.jpg.jpg    # RENAME to mini-tin-vanilla.jpg
│   │   ├── mini-tin-chocolate.jpg.jpg  # RENAME to mini-tin-chocolate.jpg
│   │   ├── mini-tin-strawberry.jpg.jpg # RENAME to mini-tin-strawberry.jpg
│   │   └── ... (other images)
│   └── src/
│       ├── lib/
│       │   └── productImages.ts        # Image mapping overrides (UPDATED)
│       └── pages/
│           ├── Products.tsx            # Uses getProductImageUrl (UPDATED)
│           ├── ValentinesCollection.tsx
│           └── BuildYourOwn.tsx
├── server/
│   ├── routers.ts                      # tRPC API routes
│   ├── webhook.ts                      # Stripe webhook handler
│   └── db.ts                           # Database operations
├── drizzle/
│   └── schema.ts                       # Database schema
├── update-valentines-pricing.mjs       # DATABASE UPDATE SCRIPT (RUN THIS)
└── HANDOFF.md                          # This file
```

---

## Valentine's Day Product Structure

### Tier Boxes (from flyer)

**Fairytale Crush Box - $50**
- One Mini Cake (chocolate, vanilla confetti, or strawberry)
- One 5-oz Brownie with ganache
- Three Chocolate-Covered Strawberries
- Two Valentine's Oreo Pucks
- Two Chocolate Chip Cookies
- One Mini Bag of Freeze-Dried Candy

**Fairytale Sweetheart Box - $75**
- Two Mini Cakes
- Two 5-oz Brownies with ganache
- Six Chocolate-Covered Strawberries
- Two Valentine's Oreo Pucks
- Four Chocolate Chip Cookies
- One Small Bag of Freeze-Dried Candy

**Fairytale Romance Box - $100**
- Three Mini Cakes
- Two 5-oz Brownies with ganache
- One Dozen Chocolate-Covered Strawberries
- Four Valentine's Oreo Pucks
- Six Chocolate Chip Cookies
- One Large Bag of Freeze-Dried Candy

### Build-Your-Own Items

| Item | Price |
|------|-------|
| Mini Cake (each flavor) | $12 |
| 5-oz Brownie with Ganache | $6 |
| Chocolate Strawberries (Half Dozen) | $20 |
| Chocolate Strawberries (Dozen) | $35 |
| Valentine's Oreo Pucks (2-pack) | $5.50 |
| Valentine's Oreo Pucks (4-pack) | $10 |
| Chocolate Chip Cookies (2-pack) | $4 |
| Chocolate Chip Cookies (6-pack) | $10 |
| Freeze-Dried Candy (Mini) | $5 |
| Freeze-Dried Candy (Small) | $8 |
| Freeze-Dried Candy (Large) | $12 |

---

## Image Mapping Reference

File: `client/src/lib/productImages.ts`

```typescript
const PRODUCT_IMAGE_OVERRIDES: Record<string, string> = {
  // Mini Tin Cakes - each flavor has its own image
  "vanilla-birthday-mini-tin-cake": "/images/mini-tin-vanilla.jpg",
  "vanilla-confetti-mini-cake": "/images/mini-tin-vanilla.jpg",
  "mini-cake-vanilla": "/images/mini-tin-vanilla.jpg",
  "strawberry-crunch-mini-tin-cake": "/images/mini-tin-strawberry.jpg",
  "strawberry-mini-cake": "/images/mini-tin-strawberry.jpg",
  "mini-cake-strawberry": "/images/mini-tin-strawberry.jpg",
  "chocolate-mini-tin-cake": "/images/mini-tin-chocolate.jpg",
  "chocolate-mini-cake": "/images/mini-tin-chocolate.jpg",
  "mini-cake-chocolate": "/images/mini-tin-chocolate.jpg",
  // ... more mappings in file
};
```

---

## Database Connection

- **Host**: gateway02.us-east-1.prod.aws.tidbcloud.com
- **Port**: 4000
- **Username**: 3wVLnwvYiEjR9RM.58b0e4e79229
- **Database**: (check Manus settings)
- **SSL**: Required

---

## Manus Configuration

### Secrets (Settings → Secrets)
- `STRIPE_SECRET_KEY` - Live key added ✓
- `VITE_STRIPE_PUBLISHABLE_KEY` - Live key added ✓
- `STRIPE_WEBHOOK_SECRET` - **NEEDS LIVE KEY** (whsec_...)
- `ANTHROPIC_API_KEY` - Set ✓
- `DATABASE_URL` - Set by Manus

### Domains
- Primary: `fairytalefarms.net`
- Manus subdomain: `fairytalefarms.manus.space`

---

## Stripe Status

- **Account Status**: Review in progress (2-3 business days)
- **Webhook URL**: `https://fairybakery-99tqthjg.manus.space/api/stripe/webhook`
- **Webhook Status**: Active, listening to 6 events
- **Live Keys**: Added to Manus ✓
- **Webhook Secret**: NOT YET ADDED to Manus

---

## Git Branches

- `main` - Production branch
- `claude/review-repo-architecture-8fKSZ` - Has pricing script (merged partially)
- `claude/fix-image-names-and-merge-8fKSZ` - Has image renames + pricing script

**Recommended**: Merge `claude/fix-image-names-and-merge-8fKSZ` into `main`

---

## Testing Checklist

After completing the tasks above, verify:

- [ ] Mini tin images display correctly on Products page
- [ ] Valentine's Collection shows correct pricing ($50/$75/$100)
- [ ] Build Your Own page shows all items with correct prices
- [ ] Stripe checkout works (test with a small purchase)
- [ ] Webhook receives events (check Stripe dashboard)

---

## Future Work (Post-Valentine's)

User wants to migrate from Stripe to **Square** after Valentine's Day since they already use Square for in-person sales. This would require:
- Removing Stripe SDK
- Adding Square SDK
- Rewriting checkout flow
- Rewriting webhook handler

---

## Contact/Notes

- User's admin emails: tarshann@gmail.com, fairytalefarms.net@gmail.com
- Location: Castalian Springs, Tennessee
- Delivery radius: 30 miles (Sumner County)
- Order cutoff: February 12, 2026
