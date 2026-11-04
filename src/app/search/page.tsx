'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PublicListing } from '@/lib/serializers';
import ListingCard from '@/components/ListingCard';
import PuneMap from '@/components/PuneMap';
import { PUNE_LOCALITIES } from '@/lib/puneData';
import {
  Search,
  Filter,
  MapPin,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter States
  const [listingType, setListingType] = useState(searchParams.get('listingType') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [locality, setLocality] = useState(searchParams.get('locality') || '');
  const [bhk, setBhk] = useState(searchParams.get('bhk') || '');
  const [furnishing, setFurnishing] = useState(searchParams.get('furnishing') || '');
  const [possession, setPossession] = useState(searchParams.get('possession') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(1);

  // View switch: List or Map or Split
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Listings data
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Map synced bounds
  const [mapBounds, setMapBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (listingType) params.set('listingType', listingType);
      if (category) params.set('category', category);
      if (locality) params.set('locality', locality);
      if (bhk) params.set('bhk', bhk);
      if (furnishing) params.set('furnishing', furnishing);
      if (possession) params.set('possession', possession);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sort) params.set('sort', sort);
      if (q) params.set('q', q);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await fetch(`/api/listings?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setListings(data.data || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [listingType, category, locality, bhk, furnishing, possession, minPrice, maxPrice, sort, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleResetFilters = () => {
    setListingType('');
    setCategory('');
    setLocality('');
    setBhk('');
    setFurnishing('');
    setPossession('');
    setMinPrice('');
    setMaxPrice('');
    setSort('newest');
    setQ('');
    setPage(1);
    router.push('/search');
  };

  return (
    <div className="py-6 space-y-6">
      {/* Search Header Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Keyword Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Pune properties by keyword, project, or locality..."
            className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        {/* View Mode & Filter Toggles */}
        <div className="flex items-center space-x-2">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFiltersMobile(true)}
            className="md:hidden flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* View Mode Switcher (Desktop) */}
          <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl text-slate-600">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1 ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters Sidebar + Listings / Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Filters Sidebar */}
        <aside className="hidden md:block lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Pune Filters</h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-slate-500 hover:text-emerald-600 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Listing Type: Sale or Rent */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Listing Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setListingType(listingType === 'Sale' ? '' : 'Sale');
                  setPage(1);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                  listingType === 'Sale'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => {
                  setListingType(listingType === 'Rent' ? '' : 'Rent');
                  setPage(1);
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                  listingType === 'Rent'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Rent
              </button>
            </div>
          </div>

          {/* Pune Locality */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Pune Locality
            </label>
            <select
              value={locality}
              onChange={(e) => {
                setLocality(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="">All Pune Localities</option>
              {PUNE_LOCALITIES.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} ({loc.zone} Pune)
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Property Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="">All Categories</option>
              <option value="Apartment/Flat">Apartment / Flat</option>
              <option value="Independent House">Independent House</option>
              <option value="Villa">Luxury Villa</option>
              <option value="Plot/Land">Plot / Land</option>
              <option value="Office">Office Space</option>
              <option value="Shop">Shop / Retail</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </div>

          {/* BHK */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              BHK Configuration
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    setBhk(bhk === b ? '' : b);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                    bhk === b
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Furnishing */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Furnishing
            </label>
            <select
              value={furnishing}
              onChange={(e) => {
                setFurnishing(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
            >
              <option value="">Any Furnishing</option>
              <option value="Unfurnished">Unfurnished</option>
              <option value="Semi-Furnished">Semi-Furnished</option>
              <option value="Fully-Furnished">Fully-Furnished</option>
            </select>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Price"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </aside>

        {/* Content Column */}
        <main
          className={`${
            viewMode === 'split'
              ? 'lg:col-span-9'
              : viewMode === 'list'
              ? 'lg:col-span-9'
              : 'lg:col-span-9'
          } space-y-4`}
        >
          {/* Results count & Pune tag */}
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span>
              Showing <strong className="text-slate-900">{total}</strong> verified Pune properties
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Region: Pune & PCMC
            </span>
          </div>

          {/* Split Mode: Half List, Half Map */}
          {viewMode === 'split' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-6 space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                    <p className="text-base font-bold text-slate-800">No Pune listings found</p>
                    <p className="text-xs text-slate-500 mt-1">Try relaxing your search filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listings.map((item) => (
                      <ListingCard key={item.id} listing={item} />
                    ))}
                  </div>
                )}
              </div>

              {/* Map Column */}
              <div className="xl:col-span-6 sticky top-24 h-[650px]">
                <PuneMap listings={listings} />
              </div>
            </div>
          )}

          {/* List Only Mode */}
          {viewMode === 'list' && (
            <div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="h-72 bg-slate-100 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                  <p className="text-base font-bold text-slate-800">No Pune listings found</p>
                  <p className="text-xs text-slate-500 mt-1">Try relaxing your search filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map Only Mode */}
          {viewMode === 'map' && (
            <div className="h-[700px] w-full">
              <PuneMap listings={listings} />
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-6 flex items-center justify-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {showFiltersMobile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end md:hidden">
          <div className="w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-4 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm">Pune Filters</h3>
                <button
                  onClick={() => setShowFiltersMobile(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Listing Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Listing Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setListingType(listingType === 'Sale' ? '' : 'Sale')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      listingType === 'Sale'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType(listingType === 'Rent' ? '' : 'Rent')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      listingType === 'Rent'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    Rent
                  </button>
                </div>
              </div>

              {/* Locality */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pune Locality
                </label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800"
                >
                  <option value="">All Pune Localities</option>
                  {PUNE_LOCALITIES.map((l) => (
                    <option key={l.name} value={l.name}>{l.name} ({l.zone} Pune)</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Property Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800"
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

              {/* BHK */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  BHK
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['1 BHK', '2 BHK', '3 BHK', '4 BHK'].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBhk(bhk === b ? '' : b)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${
                        bhk === b
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowFiltersMobile(false);
                  setPage(1);
                  fetchListings();
                }}
                className="w-full py-3 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Apply Filters ({total} found)
              </button>
              <button
                onClick={() => {
                  handleResetFilters();
                  setShowFiltersMobile(false);
                }}
                className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Pune search...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
