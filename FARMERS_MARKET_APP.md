# Farmers Market Marketplace App — Claude Code Build Spec

## Project Overview

A mobile-first, feature-rich web app connecting East Midlands (and eventually UK-wide) farmers market producers directly with consumers. Producers list stock, consumers browse and order, fulfilment is flexible (producer ships, founder consolidates, or click & collect). Platform takes a commission per order. Revenue flows through Veltro Ltd.

---

## Tech Stack

- **Frontend (Web):** React + TypeScript + Tailwind CSS
- **Frontend (Mobile):** React Native + Expo (shared logic where possible)
- **Backend/DB:** Firebase (Firestore, Auth, Storage, Functions)
- **Payments:** Stripe (Connect for marketplace multi-party payouts)
- **Hosting:** Vercel (web) / Expo EAS (mobile builds)
- **Notifications:** Firebase Cloud Messaging (push) + SendGrid (email)

---

## Core User Roles

### 1. Consumer
- Browse and search produce by category, producer, or location
- Place orders with flexible delivery/collection options
- Manage orders, track status, leave reviews
- Subscribe for weekly boxes or recurring orders

### 2. Producer
- Self-onboard and create a storefront
- List products with images, pricing, availability, and fulfilment method
- Manage incoming orders and update fulfilment status
- View earnings dashboard and payout history

### 3. Platform Admin (Founder)
- Approve/reject producer applications
- Override order statuses
- View full platform analytics
- Manage commission rates and payout schedules
- Feature producers or seasonal products on homepage

---

## App Structure

### Web App Pages

```
/                        → Homepage (hero, featured producers, seasonal picks)
/producers               → Browse all producers (map + list view)
/producers/[slug]        → Producer storefront
/shop                    → Full product catalogue with filters
/shop/[productId]        → Product detail page
/basket                  → Basket / checkout
/checkout                → Stripe payment flow
/orders                  → Consumer order history
/orders/[orderId]        → Order detail + tracking
/account                 → Consumer profile, addresses, preferences
/producer/dashboard      → Producer home (orders, revenue snapshot)
/producer/products       → Product management (CRUD)
/producer/orders         → Incoming order management
/producer/payouts        → Earnings and Stripe Connect status
/producer/onboarding     → Producer signup flow
/admin                   → Admin dashboard
/admin/producers         → Producer approval queue
/admin/orders            → Platform-wide order view
/admin/analytics         → Revenue, GMV, order volume charts
```

### Mobile Screens (React Native / Expo)

```
Home (feed + featured)
Browse (map view + category filters)
Producer Profile
Product Detail
Basket
Checkout
Order Tracking
Account / Profile
Producer: Dashboard
Producer: Add/Edit Product
Producer: Order Management
```

---

## Key Features

### Consumer-Facing
- **Discovery:** Category browse (veg, fruit, dairy, meat, bakery, preserves, etc.), producer map, seasonal highlights
- **Search:** Full-text search with filters (location radius, category, dietary flags, price range)
- **Product pages:** Photos, producer story, origin info, allergen/dietary tags, stock level
- **Basket:** Multi-producer basket with per-producer fulfilment options
- **Checkout:** Stripe payment, address management, delivery slot selection or collection point
- **Subscriptions:** Weekly box builder (pick items, set frequency, pause/cancel anytime)
- **Order tracking:** Status updates (confirmed, packed, dispatched, delivered)
- **Reviews:** Post-delivery producer and product ratings
- **Favourites:** Save producers and products

### Producer-Facing
- **Onboarding wizard:** Business details, bank account (Stripe Connect), product categories, fulfilment preferences
- **Product management:** Add/edit/archive products, bulk stock updates, seasonal availability toggles
- **Order management:** Accept/reject, update status, print packing lists
- **Earnings dashboard:** Revenue charts, commission breakdown, payout schedule
- **Storefront customisation:** Banner image, bio, producer story, social links

### Platform / Admin
- **Producer approval:** Review applications, request more info, approve/reject
- **Commission engine:** Configurable % per producer tier or category
- **Featured slots:** Manual or automated homepage featuring
- **Analytics:** GMV, order volume, active producers, consumer retention, top products
- **Dispute handling:** Refund/cancel controls

---

## Data Models (Firestore)

```typescript
// Users
users/{userId}
  role: 'consumer' | 'producer' | 'admin'
  name, email, phone
  addresses: Address[]
  favourites: string[] // productIds
  createdAt: Timestamp

// Producers
producers/{producerId}
  userId: string
  name, slug, bio, location
  address: Address
  categories: string[]
  images: { banner, logo }
  stripeConnectId: string
  status: 'pending' | 'approved' | 'suspended'
  commissionRate: number // percentage
  fulfilmentOptions: ('ship' | 'collect' | 'consolidate')[]
  createdAt: Timestamp

// Products
products/{productId}
  producerId: string
  name, description, slug
  category: string
  price: number // pence
  unit: string // 'kg' | 'each' | 'bunch' | 'dozen' etc
  stock: number
  images: string[]
  dietary: string[] // 'vegan' | 'gluten-free' etc
  allergens: string[]
  seasonal: boolean
  available: boolean
  createdAt: Timestamp

// Orders
orders/{orderId}
  consumerId: string
  items: OrderItem[]
  producerIds: string[] // for multi-producer orders
  status: 'pending' | 'confirmed' | 'packed' | 'dispatched' | 'delivered' | 'cancelled'
  fulfilmentMethod: 'delivery' | 'collection'
  deliveryAddress?: Address
  collectionPoint?: string
  subtotal: number
  commission: number
  total: number
  stripePaymentIntentId: string
  createdAt: Timestamp

// Reviews
reviews/{reviewId}
  orderId, consumerId, producerId, productId
  rating: number // 1-5
  comment: string
  createdAt: Timestamp

// Subscriptions
subscriptions/{subscriptionId}
  consumerId: string
  items: SubscriptionItem[]
  frequency: 'weekly' | 'fortnightly' | 'monthly'
  nextDelivery: Timestamp
  status: 'active' | 'paused' | 'cancelled'
```

---

## Stripe Integration Notes

- Use **Stripe Connect** (Standard or Express accounts for producers)
- Platform collects full payment, splits to producer minus commission via Stripe transfers
- Stripe webhooks handle payment confirmation, payout events
- Test with Stripe test mode throughout development; switch to live keys at launch

---

## Firebase Functions (Backend Logic)

```
onOrderCreated        → Send confirmation emails, notify producer
onOrderStatusUpdate   → Push notification to consumer
onPaymentConfirmed    → Trigger Stripe transfer to producer
onProducerApproved    → Send welcome email, enable storefront
scheduledWeeklyBoxes  → Process subscription orders weekly
commissionCalculator  → Apply correct rate per producer/order
```

---

## Environment Variables Required

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY           // server-side / functions only
STRIPE_WEBHOOK_SECRET
SENDGRID_API_KEY
```

---

## Build Phases

### Phase 1 — MVP (Week 1-3)
- Auth (Firebase email/password + Google OAuth)
- Consumer: browse producers, view products, add to basket, checkout via Stripe
- Producer: onboarding, add products, view orders
- Basic order status flow
- Web only

### Phase 2 — Core Platform (Week 4-6)
- Admin dashboard + producer approval
- Producer earnings dashboard + Stripe Connect payouts
- Reviews and ratings
- Search and filters
- Mobile app (React Native/Expo) mirroring web MVP

### Phase 3 — Growth Features (Week 7-10)
- Subscription / weekly box builder
- Producer map (Google Maps or Mapbox)
- Push notifications
- Seasonal and featured slots
- Analytics dashboard

---

## Notes for Claude Code

- Prioritise mobile-first responsive design throughout the web app
- Use Tailwind for all styling; no inline styles
- All Firestore queries must include security rules from day one — never ship open rules
- Stripe payment flows must be server-side (Firebase Functions) — never expose secret keys client-side
- Use React Query or SWR for data fetching and cache management
- Keep producer and consumer flows in clearly separated route groups
- Commission calculation logic must live in Firebase Functions, not client
- All monetary values stored in pence (integers), displayed in pounds
- Stub out SendGrid emails in Phase 1 with console.log, wire up properly in Phase 2
