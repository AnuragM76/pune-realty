'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { PublicListing } from '@/lib/serializers';
import { formatPrice } from './ListingCard';
import Link from 'next/link';

// Dynamically load leaflet components to prevent SSR window issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

interface PuneMapProps {
  listings: PublicListing[];
  center?: [number, number];
  zoom?: number;
  onBoundsChange?: (bounds: { south: number; north: number; west: number; east: number }) => void;
  selectedId?: number | null;
}

export default function PuneMap({
  listings,
  center = [18.5204, 73.8567], // Pune center
  zoom = 12,
  selectedId,
}: PuneMapProps) {
  const [mounted, setMounted] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
      // Fix default leaflet icons in Next.js
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }, []);

  if (!mounted || !L) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400 text-sm">
        Loading Pune Map...
      </div>
    );
  }

  // Pune boundary limits (locking map view)
  const puneMaxBounds: [[number, number], [number, number]] = [
    [18.25, 73.55], // Southwest
    [18.80, 74.25], // Northeast
  ];

  return (
    <div className="w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <MapContainer
        center={center}
        zoom={zoom}
        maxBounds={puneMaxBounds}
        minZoom={10}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full"
        style={{ height: '100%', minHeight: '450px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {listings.map((prop) => {
          const lat = Number(prop.lat);
          const lng = Number(prop.lng);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={prop.id} position={[lat, lng]}>
              <Popup className="pune-map-popup">
                <div className="p-1 max-w-[200px]">
                  <img
                    src={prop.coverImage || (prop.images?.[0]?.url) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=400&q=80'}
                    alt={prop.title}
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{prop.title}</div>
                  <div className="text-xs font-semibold text-emerald-600 mt-1">
                    {formatPrice(prop.price, prop.listingType)}
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">{prop.locality}, Pune</div>
                  <Link
                    href={`/listings/${prop.slug || prop.id}`}
                    className="block text-center w-full py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition"
                  >
                    View Details
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
