import pool from '@/lib/db';
import { serializePublicListing, PublicListing } from '@/lib/serializers';
import PuneHeroSearch from '@/components/PuneHeroSearch';
import ListingCard from '@/components/ListingCard';
import Link from 'next/link';
import { ShieldCheck, MapPin, Building, KeyRound, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

async function getFeaturedListings(): Promise<PublicListing[]> {
  try {
    const sql = `
      SELECT l.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url) ORDER BY img.display_order ASC)
           FROM listing_images img WHERE img.listing_id = l.id), '[]'::json
        ) as images,
        COALESCE(
          (SELECT json_agg(am.name)
           FROM listing_amenities lam
           JOIN amenities am ON am.id = lam.amenity_id
           WHERE lam.listing_id = l.id), '[]'::json
        ) as amenities
      FROM listings l
      WHERE l.status = 'approved' AND l.is_deleted = FALSE
      ORDER BY l.is_featured DESC, l.created_at DESC
      LIMIT 8;
    `;
    const res = await pool.query(sql);
    return res.rows.map((r) => serializePublicListing(r));
  } catch (error) {
    console.error('Home page listings fetch error:', error);
    return [];
  }
}

export default async function HomePage() {
  const listings = await getFeaturedListings();

  return (
    <div className="space-y-16 py-6 sm:py-10">
      {/* 1. Pune-Locked Hero & Search */}
      <section>
        <PuneHeroSearch />
      </section>

      {/* 2. Platform Value Props (Zero Paywalls & Broker Safety) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Zero Paywalls or Unlock Fees
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Everything is 100% free to view, search, and submit. We don't hide contact info behind paywalls, subscription plans, or coin credits.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Owner Contact Privacy
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Property owner contact details are strictly private and never published. Inquiries are routed exclusively through our licensed broker.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Strictly Pune & PCMC
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every listing is geo-verified within official Pune municipal and PCMC district bounds with valid postal codes (411xxx & 412xxx).
          </p>
        </div>
      </section>

      {/* 3. Featured Properties Grid */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handpicked Properties</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Latest Pune Listings for Sale & Rent
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/search?listingType=Sale"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 bg-white shadow-sm transition"
            >
              Browse Sales
            </Link>
            <Link
              href="/search?listingType=Rent"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 bg-white shadow-sm transition"
            >
              Browse Rentals
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>

        <div className="pt-4 text-center">
          <Link
            href="/search"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-md"
          >
            <span>Explore All 20+ Pune Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Pune Neighborhoods Showcase */}
      <section className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white">
        <div className="max-w-2xl mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Explore Pune by Micro-Market
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            From tech hubs like Hinjewadi and Kharadi to prestigious living in Baner, Aundh, and Koregaon Park.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Baner', count: 'Flats & Villas', zone: 'West' },
            { name: 'Hinjewadi', count: 'IT Rentals & Apts', zone: 'PCMC' },
            { name: 'Wakad', count: 'Villas & Highrises', zone: 'PCMC' },
            { name: 'Kharadi', count: 'Offices & Towers', zone: 'East' },
            { name: 'Kothrud', count: 'Family Homes', zone: 'West' },
            { name: 'Viman Nagar', count: 'Luxury Living', zone: 'East' },
          ].map((loc) => (
            <Link
              key={loc.name}
              href={`/search?locality=${loc.name}`}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition group flex flex-col justify-between"
            >
              <span className="text-xs text-emerald-400 font-semibold">{loc.zone} Pune</span>
              <div className="mt-3">
                <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition">
                  {loc.name}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{loc.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
