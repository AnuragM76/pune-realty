import { Metadata } from 'next';
import pool from '@/lib/db';
import { serializePublicListing, PublicListing } from '@/lib/serializers';
import { notFound } from 'next/navigation';
import BrokerInquiryForm from '@/components/BrokerInquiryForm';
import ListingCard from '@/components/ListingCard';
import { formatPrice } from '@/lib/formatters';
import PuneMap from '@/components/PuneMap';
import Link from 'next/link';
import {
  BedDouble,
  Maximize2,
  Calendar,
  Compass,
  Building,
  Layers,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Share2,
  ArrowLeft,
  PhoneCall,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

async function getListingData(id: string): Promise<{ listing: PublicListing; similar: PublicListing[] } | null> {
  try {
    const isNumeric = /^\d+$/.test(id);
    const lookupClause = isNumeric ? 'l.id = $1' : 'l.slug = $1';

    const sql = `
      SELECT 
        l.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url, 'caption', img.caption, 'displayOrder', img.display_order) ORDER BY img.display_order ASC)
           FROM listing_images img WHERE img.listing_id = l.id), '[]'::json
        ) as images,
        COALESCE(
          (SELECT json_agg(am.name)
           FROM listing_amenities lam
           JOIN amenities am ON am.id = lam.amenity_id
           WHERE lam.listing_id = l.id), '[]'::json
        ) as amenities
      FROM listings l
      WHERE ${lookupClause} AND l.status = 'approved' AND l.is_deleted = FALSE;
    `;

    const res = await pool.query(sql, [id]);
    if (res.rows.length === 0) return null;

    const raw = res.rows[0];
    const listing = serializePublicListing(raw);

    // Fetch similar
    const similarSql = `
      SELECT l.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url) ORDER BY img.display_order ASC)
           FROM listing_images img WHERE img.listing_id = l.id), '[]'::json
        ) as images
      FROM listings l
      WHERE l.id != $1 AND l.status = 'approved' AND l.is_deleted = FALSE
        AND (l.locality = $2 OR l.listing_type = $3)
      ORDER BY (l.locality = $2) DESC, l.created_at DESC
      LIMIT 3;
    `;
    const simRes = await pool.query(similarSql, [listing.id, listing.locality, listing.listingType]);
    const similar = simRes.rows.map((r) => serializePublicListing(r));

    return { listing, similar };
  } catch (error) {
    console.error('Error fetching property detail:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getListingData(resolvedParams.id);
  if (!data) {
    return { title: 'Property Not Found | PuneRealty' };
  }

  const { listing } = data;
  const priceStr = formatPrice(listing.price, listing.listingType);
  const title = `${listing.title} | ${priceStr} | ${listing.locality}, Pune`;
  const description = `${listing.bhk || ''} ${listing.propertyCategory} for ${listing.listingType} in ${listing.locality}, Pune. ${listing.carpetAreaSqft} sq.ft. Direct broker contact: ${listing.broker.phone}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.coverImage ? [listing.coverImage] : [],
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const data = await getListingData(resolvedParams.id);

  if (!data) {
    notFound();
  }

  const { listing, similar } = data;

  // JSON-LD Structured Data for Pune SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.title,
    description: listing.description,
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'INR',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.locality,
      addressRegion: 'Pune, Maharashtra',
      postalCode: listing.pincode,
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.lat,
      longitude: listing.lng,
    },
    broker: {
      '@type': 'RealEstateAgent',
      name: listing.broker.name,
      telephone: listing.broker.phone,
      email: listing.broker.email,
    },
  };

  const imagesList = listing.images?.length > 0
    ? listing.images.map((img) => img.url)
    : [listing.coverImage || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="py-6 sm:py-8 space-y-8">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-emerald-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href={`/search?locality=${listing.locality}`} className="hover:text-emerald-600 transition">
          {listing.locality}, Pune
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-semibold truncate max-w-xs">{listing.title}</span>
      </nav>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
              For {listing.listingType}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {listing.propertyCategory}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              Pune Verified
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {listing.title}
          </h1>

          <div className="flex items-center space-x-2 mt-2 text-xs sm:text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{listing.address}, {listing.locality}, Pune, Maharashtra - {listing.pincode}</span>
          </div>
        </div>

        {/* Pricing Box */}
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 text-left md:text-right shrink-0">
          <div className="text-xs uppercase font-bold text-emerald-700">
            {listing.listingType === 'Sale' ? 'Expected Price' : 'Monthly Rent'}
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
            {formatPrice(listing.price, listing.listingType)}
          </div>
          {listing.deposit > 0 && (
            <div className="text-xs text-slate-600 mt-1">
              Deposit: ₹{listing.deposit.toLocaleString('en-IN')}
            </div>
          )}
          {listing.maintenanceCharges > 0 && (
            <div className="text-[11px] text-slate-500">
              + ₹{listing.maintenanceCharges.toLocaleString('en-IN')}/mo maintenance
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden max-h-[500px]">
        {/* Main Cover */}
        <div className="md:col-span-2 relative aspect-[16/10] md:aspect-auto md:h-full bg-slate-100 overflow-hidden">
          <img
            src={imagesList[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Additional Images */}
        <div className="hidden md:grid grid-rows-2 gap-3">
          <div className="bg-slate-100 overflow-hidden rounded-xl">
            <img
              src={imagesList[1] || imagesList[0]}
              alt="Property Interior"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-slate-100 overflow-hidden rounded-xl relative">
            <img
              src={imagesList[2] || imagesList[0]}
              alt="Property View"
              className="w-full h-full object-cover"
            />
            {imagesList.length > 3 && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold">
                +{imagesList.length - 3} More Photos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout: Property Specs vs Broker Contact Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Property Facts, Amenities, Map */}
        <div className="lg:col-span-8 space-y-8">
          {/* Key Facts Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Key Property Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              {listing.bhk && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Configuration</span>
                  <span className="font-bold text-slate-900 text-sm">{listing.bhk}</span>
                </div>
              )}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Carpet Area</span>
                <span className="font-bold text-slate-900 text-sm">{listing.carpetAreaSqft} sq.ft</span>
              </div>
              {listing.builtupAreaSqft && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Built-up Area</span>
                  <span className="font-bold text-slate-900 text-sm">{listing.builtupAreaSqft} sq.ft</span>
                </div>
              )}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Possession Status</span>
                <span className="font-bold text-slate-900 text-sm">{listing.possessionStatus}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Furnishing</span>
                <span className="font-bold text-slate-900 text-sm">{listing.furnishingStatus || 'Unfurnished'}</span>
              </div>
              {listing.floorNumber !== null && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Floor</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {listing.floorNumber} {listing.totalFloors ? `of ${listing.totalFloors}` : ''}
                  </span>
                </div>
              )}
              {listing.facingDirection && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Facing Direction</span>
                  <span className="font-bold text-slate-900 text-sm">{listing.facingDirection}</span>
                </div>
              )}
              {listing.parking && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Parking</span>
                  <span className="font-bold text-slate-900 text-sm">{listing.parking}</span>
                </div>
              )}
              {listing.preferredTenants && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Preferred Tenants</span>
                  <span className="font-bold text-slate-900 text-sm">{listing.preferredTenants}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              Property Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          </div>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                Society & Project Amenities
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {listing.amenities.map((am) => (
                  <div key={am} className="flex items-center space-x-2 text-xs font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{am}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Map Location */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Location in {listing.locality}, Pune
            </h3>
            <p className="text-xs text-slate-500">
              Pinned strictly within Pune bounds at coordinates: {listing.lat.toFixed(4)}, {listing.lng.toFixed(4)}
            </p>
            <div className="h-80 w-full rounded-xl overflow-hidden border border-slate-200">
              <PuneMap listings={[listing]} center={[listing.lat, listing.lng]} zoom={14} />
            </div>
          </div>
        </div>

        {/* Right Column: Broker Official Contact Box (Sole Contact) */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <BrokerInquiryForm
            listingId={listing.id}
            listingTitle={listing.title}
            brokerPhone={listing.broker?.phone}
            brokerName={listing.broker?.name}
          />
        </div>
      </div>

      {/* Similar Pune Properties */}
      {similar.length > 0 && (
        <section className="pt-8 border-t border-slate-200 space-y-4">
          <h3 className="text-xl font-bold text-slate-900">
            Similar Properties in {listing.locality}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {similar.map((sim) => (
              <ListingCard key={sim.id} listing={sim} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
