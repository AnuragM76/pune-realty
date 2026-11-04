'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicListing } from '@/lib/serializers';
import { formatPrice } from '@/lib/formatters';
import { Heart, BedDouble, Maximize2, MapPin, IndianRupee, PhoneCall, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ListingCardProps {
  listing: PublicListing;
  isSavedInitial?: boolean;
  onSaveToggle?: (id: number, saved: boolean) => void;
}

export { formatPrice };

export default function ListingCard({ listing, isSavedInitial = false, onSaveToggle }: ListingCardProps) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(isSavedInitial);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/saved-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(data.saved);
        if (onSaveToggle) onSaveToggle(listing.id, data.saved);
      }
    } finally {
      setSaving(false);
    }
  };

  const coverUrl = listing.coverImage || (listing.images?.[0]?.url) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image Banner */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={coverUrl}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
              listing.listingType === 'Sale'
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            For {listing.listingType}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/60 backdrop-blur-md text-white">
            {listing.propertyCategory}
          </span>
        </div>

        {/* Save Shortlist Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          title={saved ? 'Remove from Saved' : 'Save Property'}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-red-500 shadow-md transition"
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Price Tag Overlay bottom */}
        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1">
          <span className="text-base font-bold tracking-tight">
            {formatPrice(listing.price, listing.listingType)}
          </span>
          {listing.pricePerSqft && listing.listingType === 'Sale' && (
            <span className="text-[11px] text-slate-300 ml-1.5 pl-1.5 border-l border-slate-600">
              ₹{listing.pricePerSqft.toLocaleString('en-IN')}/sq.ft
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Locality & Location */}
          <div className="flex items-center space-x-1 text-slate-500 text-xs font-medium mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{listing.locality}, Pune ({listing.pincode})</span>
          </div>

          {/* Title */}
          <Link href={`/listings/${listing.slug || listing.id}`}>
            <h3 className="text-base font-semibold text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition">
              {listing.title}
            </h3>
          </Link>

          {/* Key Facts Pills */}
          <div className="mt-3 grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-xs text-slate-600">
            {listing.bhk && (
              <div className="flex items-center space-x-1">
                <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-800">{listing.bhk}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{listing.carpetAreaSqft} sq.ft</span>
            </div>
            <div className="flex items-center space-x-1 truncate">
              <span className="text-slate-400">Status:</span>
              <span className="truncate font-medium text-slate-700">{listing.possessionStatus}</span>
            </div>
          </div>
        </div>

        {/* Broker Direct Contact Bar (Sole Contact Shown - Owner Always Protected) */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-700">
              Broker Direct
            </span>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[160px]">
              {listing.broker?.phone || '+91 98220 12345'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={`/listings/${listing.slug || listing.id}#inquire`}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition"
            >
              Inquire
            </Link>
            <Link
              href={`/listings/${listing.slug || listing.id}`}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition shadow-sm"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
