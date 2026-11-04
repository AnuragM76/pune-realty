'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PUNE_LOCALITIES, isValidPunePincode, isWithinPuneBounds, detectContactInfo } from '@/lib/puneData';
import { UploadCloud, CheckCircle, AlertTriangle, ShieldCheck, MapPin, IndianRupee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Basic Details
  const [title, setTitle] = useState('');
  const [listingType, setListingType] = useState<'Sale' | 'Rent'>('Sale');
  const [propertyCategory, setPropertyCategory] = useState('Apartment/Flat');
  const [bhk, setBhk] = useState('2 BHK');
  const [carpetAreaSqft, setCarpetAreaSqft] = useState('');
  const [builtupAreaSqft, setBuiltupAreaSqft] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [totalFloors, setTotalFloors] = useState('');
  const [ageOfProperty, setAgeOfProperty] = useState('0-1 year');
  const [facingDirection, setFacingDirection] = useState('East');
  const [furnishingStatus, setFurnishingStatus] = useState('Semi-Furnished');
  const [bathrooms, setBathrooms] = useState('2');
  const [balconies, setBalconies] = useState('1');
  const [parking, setParking] = useState('1 Covered');
  const [possessionStatus, setPossessionStatus] = useState('Ready to Move');
  const [preferredTenants, setPreferredTenants] = useState('Any');

  // Pricing
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');
  const [maintenanceCharges, setMaintenanceCharges] = useState('');
  const [isNegotiable, setIsNegotiable] = useState(false);

  // Pune Location
  const [locality, setLocality] = useState(PUNE_LOCALITIES[0].name);
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState(PUNE_LOCALITIES[0].pincode);
  const [lat, setLat] = useState(PUNE_LOCALITIES[0].lat);
  const [lng, setLng] = useState(PUNE_LOCALITIES[0].lng);

  // Description & Content Moderation
  const [description, setDescription] = useState('');
  const [leakWarning, setLeakWarning] = useState<string | null>(null);

  // Media
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Amenities
  const availableAmenities = [
    'Lift', 'Power Backup', 'Gymnasium', 'Swimming Pool', 'Clubhouse',
    '24x7 Security', 'Gated Community', 'Reserved Parking', 'Visitor Parking',
    'Children Play Area', 'Gas Pipeline', 'Rain Water Harvesting', 'Park / Garden'
  ];
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Lift', 'Power Backup', '24x7 Security']);

  // Strictly Private Owner Details (Admin broker only)
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [ownerPhone, setOwnerPhone] = useState(user?.phone || '');
  const [ownerEmail, setOwnerEmail] = useState(user?.email || '');
  const [ownerNotes, setOwnerNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-fill coordinates & pincode when locality changes
  const handleLocalityChange = (locName: string) => {
    setLocality(locName);
    const match = PUNE_LOCALITIES.find((l) => l.name === locName);
    if (match) {
      setPincode(match.pincode);
      setLat(match.lat);
      setLng(match.lng);
    }
  };

  // Real-time bypass contact detection in description
  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    const scan = detectContactInfo(text);
    if (scan.containsContact) {
      setLeakWarning(
        `Notice: Phone numbers, emails, or handles detected (${scan.matches.join(
          ', '
        )}). Platform policy routes all inquiries through the broker to protect owner privacy.`
      );
    } else {
      setLeakWarning(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append('files', e.target.files[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setImages((prev) => [...prev, ...data.urls]);
    } catch (err: any) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!user) {
      window.location.href = `/login?redirect=${encodeURIComponent('/listings/new')}`;
      return;
    }

    if (!isValidPunePincode(pincode)) {
      setError(`Pincode ${pincode} is not a valid Pune postal code (must start with 411 or 412).`);
      return;
    }

    if (!isWithinPuneBounds(lat, lng)) {
      setError('Coordinates fall outside Pune geographic limits.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        listingType,
        propertyCategory,
        bhk,
        carpetAreaSqft: Number(carpetAreaSqft),
        builtupAreaSqft: builtupAreaSqft ? Number(builtupAreaSqft) : null,
        floorNumber: floorNumber ? Number(floorNumber) : null,
        totalFloors: totalFloors ? Number(totalFloors) : null,
        ageOfProperty,
        facingDirection,
        furnishingStatus,
        bathrooms: Number(bathrooms),
        balconies: Number(balconies),
        parking,
        possessionStatus,
        price: Number(price),
        deposit: deposit ? Number(deposit) : 0,
        maintenanceCharges: maintenanceCharges ? Number(maintenanceCharges) : 0,
        isNegotiable,
        locality,
        address,
        pincode,
        lat,
        lng,
        preferredTenants: listingType === 'Rent' ? preferredTenants : null,
        description,
        coverImage: images[0] || null,
        images,
        amenities: selectedAmenities,
        // Private owner data
        ownerName,
        ownerPhone,
        ownerEmail,
        ownerNotes,
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit listing.');
      }

      setSuccessMsg(data.message);
      setTimeout(() => {
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error creating property listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-8">
      {/* Page Title & Guidelines */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <MapPin className="w-3.5 h-3.5" />
          <span>Locked to Pune & PCMC Region</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Post a Property Listing in Pune
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Publish free for Sale or Rent. Owner contact numbers remain private in internal broker records. Only the broker's number is shown publicly.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* 1. Basic Type & Category */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            1. Listing Type & Category
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Type</label>
              <select
                value={listingType}
                onChange={(e) => setListingType(e.target.value as 'Sale' | 'Rent')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="Sale">Sale (Buy)</option>
                <option value="Rent">Rent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Property Category</label>
              <select
                value={propertyCategory}
                onChange={(e) => setPropertyCategory(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="Apartment/Flat">Apartment / Flat</option>
                <option value="Independent House">Independent House</option>
                <option value="Villa">Luxury Villa</option>
                <option value="Plot/Land">Plot / Land</option>
                <option value="Office">Commercial Office</option>
                <option value="Shop">Shop / Retail</option>
                <option value="Warehouse">Warehouse</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">BHK Configuration</label>
              <select
                value={bhk}
                onChange={(e) => setBhk(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="1 BHK">1 BHK</option>
                <option value="2 BHK">2 BHK</option>
                <option value="3 BHK">3 BHK</option>
                <option value="4 BHK">4 BHK</option>
                <option value="5+ BHK">5+ BHK</option>
                <option value="N/A">Not Applicable (Plot/Comm.)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Property Title & Location (Pune Locked) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            2. Property Title & Pune Location
          </h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Listing Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Spacious 3 BHK Apartment in Baner with Hill Views"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pune Locality</label>
              <select
                value={locality}
                onChange={(e) => handleLocalityChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {PUNE_LOCALITIES.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.zone} Pune)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pune Pincode</label>
              <input
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="411xxx or 412xxx"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Address / Society</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Building Name, Street, Landmark"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>
          </div>
        </div>

        {/* 3. Areas & Physical Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            3. Size, Floor & Specifications
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Carpet Area (sq.ft)*</label>
              <input
                type="number"
                required
                value={carpetAreaSqft}
                onChange={(e) => setCarpetAreaSqft(e.target.value)}
                placeholder="e.g. 1150"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Built-up Area (sq.ft)</label>
              <input
                type="number"
                value={builtupAreaSqft}
                onChange={(e) => setBuiltupAreaSqft(e.target.value)}
                placeholder="e.g. 1450"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor No.</label>
              <input
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                placeholder="e.g. 7"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Floors</label>
              <input
                type="number"
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
                placeholder="e.g. 15"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Furnishing</label>
              <select
                value={furnishingStatus}
                onChange={(e) => setFurnishingStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
                <option value="Fully-Furnished">Fully-Furnished</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Possession Status</label>
              <select
                value={possessionStatus}
                onChange={(e) => setPossessionStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="Ready to Move">Ready to Move</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Immediate">Immediate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Facing</label>
              <select
                value={facingDirection}
                onChange={(e) => setFacingDirection(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="North-East">North-East</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Pricing */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            4. Pricing & Commercials
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {listingType === 'Sale' ? 'Total Price (₹)*' : 'Monthly Rent (₹)*'}
              </label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12500000 for sale or 35000 for rent"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            {listingType === 'Rent' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  placeholder="e.g. 90000"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Maintenance (₹)</label>
              <input
                type="number"
                value={maintenanceCharges}
                onChange={(e) => setMaintenanceCharges(e.target.value)}
                placeholder="e.g. 3500"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* 5. Photos Upload (Metadata stripped automatically) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            5. Media & Photos (Up to 15 photos)
          </h3>
          <p className="text-xs text-slate-500">
            Photos are automatically converted to optimized WebP and stripped of all EXIF & GPS location metadata.
          </p>

          <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-emerald-50/20 transition">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-700">Click to upload photos</span>
            <span className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP supported</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {uploading && <p className="text-xs text-emerald-600 font-semibold animate-pulse">Uploading and stripping metadata...</p>}

          {images.length > 0 && (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
              {images.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={url} alt="Upload" className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Description & Anti-Bypass Moderation */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            6. Description
          </h3>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Detailed description of features, neighborhood, views, and handover schedule..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900"
          />
          {leakWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{leakWarning}</span>
            </div>
          )}
        </div>

        {/* 7. Private Owner Details (Admin Broker Only) */}
        <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Owner Contact Details (Strictly Private - Admin Only)
              </h4>
              <p className="text-[11px] text-slate-500">
                These details will NEVER be shown to users or guests on the site or in API responses.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Name</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner legal name"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Contact Number</label>
              <input
                type="tel"
                required
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Owner Email</label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="owner@domain.com"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-50"
        >
          {loading ? 'Submitting Property...' : 'Submit Listing (Free Forever)'}
        </button>
      </form>
    </div>
  );
}
