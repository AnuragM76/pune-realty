# PuneRealty - Pune-Only Real Estate Platform

A responsive, high-performance real estate portal built exclusively for **Pune & PCMC, Maharashtra**, featuring NoBroker-style backend workflows, direct licensed broker contact, and **100% free access (zero paywalls, subscriptions, or unlock contact fees)**.

---

## Key Features & Business Rules

1. **Strict Pune Regional Lock**:
   - Only Pune and PCMC localities (Baner, Wakad, Hinjewadi, Kothrud, Kharadi, Viman Nagar, etc.) and valid Pune pincodes (`411xxx` and `412xxx`) are accepted.
   - Geographic coordinates are verified server-side against Pune regional bounds (Lat: `18.30` - `18.75`, Lng: `73.65` - `74.15`).
   - Non-Pune listings or searches are rejected on both client and server.

2. **Listing Types & Categories**:
   - **Sale** and **Rent** only (no PG, flatmates, or co-living).
   - Supported categories: **Flats/Apartments, Villas, Independent Houses, Plots/Land, Commercial Offices, Shops, Warehouses**.

3. **Strict Contact Privacy (Critical)**:
   - **Broker contact is the sole contact shown across every listing**: appears on cards, search view, and detail pages.
   - **Owner details are never shown publicly**: owner name, phone, email, and private notes are stored in a private `owner_details` database table and protected by serializer whitelisting. Non-admin API responses never return owner data.
   - Automated content moderation detects phone numbers, email addresses, and social handles in titles and descriptions to prevent bypassing the broker.

4. **Interactive Pune Map & Search**:
   - Split view with interactive Leaflet map synced to Pune listings.
   - Search by locality autocomplete, price range, BHK, carpet area, furnishing, possession, and facing direction.

5. **Broker & User Dashboards**:
   - **Broker Admin Console**: Moderation queue (approve/reject listings), view private owner contacts, manage inquiries, export listings and inquiries to CSV, manage users and platform contact settings.
   - **User Dashboard**: Track submissions, view saved shortlist properties, track inquiries sent to the broker, edit profile.

---

## Tech Stack

- **Frontend & Backend**: Next.js 16 (App Router, Turbopack, React 19, TypeScript)
- **Styling**: Tailwind CSS with custom original design system
- **Database**: PostgreSQL (`punerealestate`) with relational schemas & indexes
- **Image Processing**: Sharp (automatic metadata and EXIF/GPS stripping, WebP compression)
- **Testing**: Jest with serializer privacy tests

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node v22)
- PostgreSQL running locally or remotely

### 2. Environment Variables
Create `.env` (or `.env.local`):

```bash
DATABASE_URL="postgres://andy:andy123@localhost:5432/punerealestate"
JWT_SECRET="your_secure_jwt_secret_key"
JWT_REFRESH_SECRET="your_secure_refresh_secret_key"

# Broker Public Information (Shown on all listings)
NEXT_PUBLIC_BROKER_NAME="Pune Prime Properties (Broker Admin)"
NEXT_PUBLIC_BROKER_PHONE="+91 98220 12345"
NEXT_PUBLIC_BROKER_EMAIL="contact@puneprimeproperties.in"
NEXT_PUBLIC_BROKER_OFFICE="FC Road, Deccan Gymkhana, Pune, Maharashtra 411004"
NEXT_PUBLIC_SITE_NAME="PuneRealty"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Run Migrations & Seed Sample Pune Data
Run the comprehensive seed script to initialize tables, create the broker admin, and populate 20 realistic Pune listings across Baner, Wakad, Kharadi, Hinjewadi, and Kothrud:

```bash
npx tsx scripts/run-seed.ts
```

### 4. Running the Tests
Verify owner privacy enforcement at the API serializer level:

```bash
npx jest
```

### 5. Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seed Accounts

| Role | Email / Identifier | Password | Access |
|---|---|---|---|
| **Broker Admin** | `admin@punerealty.in` | `AdminBroker@123` | Full Admin Console (`/admin`), Private Landlord Info, Approvals, CSV Exports |
| **Registered User** | `amit.deshmukh@example.com` | `UserPassword@123` | User Dashboard (`/dashboard`), Post Listings, Shortlist, Submit Inquiries |
| **Guest** | Browsing freely | — | Search, View listings, View Broker contact |
