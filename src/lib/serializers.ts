/**
 * STRICT SERIALIZERS FOR LISTINGS AND INQUIRIES
 * 
 * CRITICAL RULE: Owner details and identifying private information MUST NEVER
 * be serialized into any response sent to non-admin clients, page sources, or exports.
 * 
 * Enforced at serializer level with strict property whitelisting.
 */

export interface PublicListing {
  id: number;
  title: string;
  slug: string;
  listingType: 'Sale' | 'Rent';
  propertyCategory: string;
  bhk: string | null;
  carpetAreaSqft: number;
  builtupAreaSqft: number | null;
  floorNumber: number | null;
  totalFloors: number | null;
  ageOfProperty: string | null;
  facingDirection: string | null;
  furnishingStatus: string | null;
  bathrooms: number;
  balconies: number;
  parking: string | null;
  possessionStatus: string;
  possessionDate: string | null;
  price: number;
  deposit: number;
  maintenanceCharges: number;
  pricePerSqft: number | null;
  isNegotiable: boolean;
  locality: string;
  address: string;
  pincode: string;
  lat: number;
  lng: number;
  preferredTenants: string | null;
  description: string;
  videoUrl: string | null;
  coverImage: string | null;
  images: Array<{ id: number; url: string; caption: string | null; displayOrder: number }>;
  amenities: string[];
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
  // BROKER PUBLIC DETAILS (Displayed on all listings instead of owners)
  broker: {
    name: string;
    phone: string;
    email: string;
    office: string;
  };
}

export interface AdminListing extends PublicListing {
  userId: number;
  userEmail: string;
  userName: string;
  userPhone: string;
  hasContactLeakFlag: boolean;
  contactLeakNotes: string | null;
  rejectionReason: string | null;
  isDeleted: boolean;
  // OWNER DETAILS - Visible strictly to Admin Broker only!
  ownerDetails: {
    id?: number;
    ownerName: string;
    ownerPhone: string;
    ownerEmail: string | null;
    ownerAddress: string | null;
    notes: string | null;
  } | null;
}

export const DEFAULT_BROKER = {
  name: process.env.NEXT_PUBLIC_BROKER_NAME || 'Pune Prime Properties (Broker Admin)',
  phone: process.env.NEXT_PUBLIC_BROKER_PHONE || '+91 98220 12345',
  email: process.env.NEXT_PUBLIC_BROKER_EMAIL || 'contact@puneprimeproperties.in',
  office: process.env.NEXT_PUBLIC_BROKER_OFFICE || 'FC Road, Deccan Gymkhana, Pune 411004',
};

/**
 * Whitelist serializer for public listings.
 * Positively guarantees no owner data or internal audit leaks.
 */
export function serializePublicListing(raw: any, brokerInfo = DEFAULT_BROKER): PublicListing {
  return {
    id: Number(raw.id),
    title: String(raw.title || ''),
    slug: String(raw.slug || ''),
    listingType: raw.listing_type,
    propertyCategory: raw.property_category,
    bhk: raw.bhk || null,
    carpetAreaSqft: Number(raw.carpet_area_sqft || 0),
    builtupAreaSqft: raw.builtup_area_sqft ? Number(raw.builtup_area_sqft) : null,
    floorNumber: raw.floor_number !== null ? Number(raw.floor_number) : null,
    totalFloors: raw.total_floors !== null ? Number(raw.total_floors) : null,
    ageOfProperty: raw.age_of_property || null,
    facingDirection: raw.facing_direction || null,
    furnishingStatus: raw.furnishing_status || null,
    bathrooms: Number(raw.bathrooms || 1),
    balconies: Number(raw.balconies || 0),
    parking: raw.parking || null,
    possessionStatus: raw.possession_status,
    possessionDate: raw.possession_date ? new Date(raw.possession_date).toISOString() : null,
    price: Number(raw.price || 0),
    deposit: Number(raw.deposit || 0),
    maintenanceCharges: Number(raw.maintenance_charges || 0),
    pricePerSqft: raw.price_per_sqft ? Number(raw.price_per_sqft) : null,
    isNegotiable: Boolean(raw.is_negotiable),
    locality: String(raw.locality || ''),
    address: String(raw.address || ''),
    pincode: String(raw.pincode || ''),
    lat: Number(raw.lat || 18.5204),
    lng: Number(raw.lng || 73.8567),
    preferredTenants: raw.preferred_tenants || null,
    description: String(raw.description || ''),
    videoUrl: raw.video_url || null,
    coverImage: raw.cover_image || null,
    images: Array.isArray(raw.images) ? raw.images : [],
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    status: raw.status,
    isFeatured: Boolean(raw.is_featured),
    viewsCount: Number(raw.views_count || 0),
    createdAt: raw.created_at ? new Date(raw.created_at).toISOString() : '',
    updatedAt: raw.updated_at ? new Date(raw.updated_at).toISOString() : '',
    broker: {
      name: brokerInfo.name,
      phone: brokerInfo.phone,
      email: brokerInfo.email,
      office: brokerInfo.office,
    },
  };
}

/**
 * Serializer for Admin view - includes private owner fields and moderation flags.
 */
export function serializeAdminListing(raw: any, brokerInfo = DEFAULT_BROKER): AdminListing {
  const publicData = serializePublicListing(raw, brokerInfo);
  return {
    ...publicData,
    userId: Number(raw.user_id),
    userEmail: String(raw.user_email || ''),
    userName: String(raw.user_name || ''),
    userPhone: String(raw.user_phone || ''),
    hasContactLeakFlag: Boolean(raw.has_contact_leak_flag),
    contactLeakNotes: raw.contact_leak_notes || null,
    rejectionReason: raw.rejection_reason || null,
    isDeleted: Boolean(raw.is_deleted),
    ownerDetails: raw.owner_name
      ? {
          id: raw.owner_detail_id ? Number(raw.owner_detail_id) : undefined,
          ownerName: String(raw.owner_name),
          ownerPhone: String(raw.owner_phone),
          ownerEmail: raw.owner_email || null,
          ownerAddress: raw.owner_address || null,
          notes: raw.owner_notes || null,
        }
      : null,
  };
}
