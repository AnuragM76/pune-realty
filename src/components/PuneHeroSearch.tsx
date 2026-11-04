'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building, KeyRound, ArrowRight } from 'lucide-react';
import { PUNE_LOCALITIES } from '@/lib/puneData';

export default function PuneHeroSearch() {
  const router = useRouter();
  const [listingType, setListingType] = useState<'Sale' | 'Rent'>('Sale');
  const [locality, setLocality] = useState('');
  const [category, setCategory] = useState('');
  const [suggestions, setSuggestions] = useState<typeof PUNE_LOCALITIES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleLocalityInput = (text: string) => {
    setLocality(text);
    if (text.trim().length > 0) {
      const filtered = PUNE_LOCALITIES.filter((l) =>
        l.name.toLowerCase().includes(text.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectLocality = (name: string) => {
    setLocality(name);
    setShowSuggestions(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set('listingType', listingType);
    if (locality) params.set('locality', locality);
    if (category) params.set('category', category);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 lg:p-14 shadow-2xl">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Pune region banner */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Pune & PCMC Exclusive Property Network</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Find your next home in Pune. <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Direct through licensed broker.
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          Zero paywalls, no paid unlock fees, and total contact privacy for owners. Browse flats, villas, plots, and offices across Baner, Wakad, Kharadi, Hinjewadi, and 30+ Pune localities.
        </p>

        {/* Search Box Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-2xl shadow-xl text-slate-900 border border-white/20">
          {/* Sale / Rent Switcher */}
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setListingType('Sale')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                listingType === 'Sale'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Buy in Pune
            </button>
            <button
              type="button"
              onClick={() => setListingType('Rent')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                listingType === 'Rent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Rent in Pune
            </button>
          </div>

          {/* Input Fields Form */}
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Pune Locality Autocomplete */}
            <div className="relative sm:col-span-6">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pune Locality
              </label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => handleLocalityInput(e.target.value)}
                  onFocus={() => locality && setShowSuggestions(true)}
                  placeholder="e.g. Baner, Wakad, Kharadi..."
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-1.5">
                    {suggestions.map((loc) => (
                      <button
                        key={loc.name}
                        type="button"
                        onClick={() => handleSelectLocality(loc.name)}
                        className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-emerald-50 rounded-lg flex items-center justify-between text-slate-700"
                      >
                        <span className="font-semibold text-slate-900">{loc.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {loc.zone} Pune ({loc.pincode})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category */}
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Property Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 font-medium"
              >
                <option value="">All Categories</option>
                <option value="Apartment/Flat">Apartment / Flat</option>
                <option value="Independent House">Independent House</option>
                <option value="Villa">Luxury Villa</option>
                <option value="Plot/Land">Plot / Land</option>
                <option value="Office">Commercial Office</option>
                <option value="Shop">Shop / Retail</option>
                <option value="Warehouse">Warehouse</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Tags */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400 font-medium">Popular:</span>
          {['Baner Flats', 'Hinjewadi Rentals', 'Wakad Villas', 'Kharadi Offices', 'Kothrud 2 BHK'].map((item) => (
            <button
              key={item}
              onClick={() => {
                const parts = item.split(' ');
                router.push(`/search?locality=${parts[0]}`);
              }}
              className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
