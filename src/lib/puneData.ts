/**
 * Pune Geographic Bounds and Localities Data
 * Official boundary limits:
 * Latitude: 18.30 to 18.75
 * Longitude: 73.65 to 74.15
 */

export const PUNE_BOUNDS = {
  minLat: 18.30,
  maxLat: 18.75,
  minLng: 73.65,
  maxLng: 74.15,
};

export interface PuneLocality {
  name: string;
  zone: 'West' | 'East' | 'Central' | 'North' | 'South' | 'PCMC';
  pincode: string;
  lat: number;
  lng: number;
}

export const PUNE_LOCALITIES: PuneLocality[] = [
  // West Pune
  { name: 'Baner', zone: 'West', pincode: '411045', lat: 18.5590, lng: 73.7868 },
  { name: 'Balewadi', zone: 'West', pincode: '411045', lat: 18.5760, lng: 73.7744 },
  { name: 'Aundh', zone: 'West', pincode: '411007', lat: 18.5580, lng: 73.8077 },
  { name: 'Pashan', zone: 'West', pincode: '411021', lat: 18.5385, lng: 73.7925 },
  { name: 'Bavdhan', zone: 'West', pincode: '411021', lat: 18.5133, lng: 73.7725 },
  { name: 'Kothrud', zone: 'West', pincode: '411038', lat: 18.5074, lng: 73.8077 },
  { name: 'Karve Nagar', zone: 'West', pincode: '411052', lat: 18.4907, lng: 73.8183 },
  { name: 'Warje', zone: 'West', pincode: '411058', lat: 18.4795, lng: 73.7975 },

  // East Pune / IT Corridor
  { name: 'Kharadi', zone: 'East', pincode: '411014', lat: 18.5514, lng: 73.9348 },
  { name: 'Viman Nagar', zone: 'East', pincode: '411014', lat: 18.5679, lng: 73.9143 },
  { name: 'Kalyani Nagar', zone: 'East', pincode: '411006', lat: 18.5463, lng: 73.9034 },
  { name: 'Koregaon Park', zone: 'East', pincode: '411001', lat: 18.5362, lng: 73.8940 },
  { name: 'Magarpatta City', zone: 'East', pincode: '411028', lat: 18.5126, lng: 73.9287 },
  { name: 'Hadapsar', zone: 'East', pincode: '411028', lat: 18.5089, lng: 73.9259 },
  { name: 'Wagholi', zone: 'East', pincode: '412207', lat: 18.5808, lng: 73.9787 },
  { name: 'Keshav Nagar (Mundhwa)', zone: 'East', pincode: '411036', lat: 18.5350, lng: 73.9390 },

  // PCMC / North West IT Belt
  { name: 'Hinjewadi Phase 1', zone: 'PCMC', pincode: '411057', lat: 18.5913, lng: 73.7389 },
  { name: 'Hinjewadi Phase 2 & 3', zone: 'PCMC', pincode: '411057', lat: 18.5833, lng: 73.7058 },
  { name: 'Wakad', zone: 'PCMC', pincode: '411057', lat: 18.5987, lng: 73.7660 },
  { name: 'Pimple Saudagar', zone: 'PCMC', pincode: '411027', lat: 18.5987, lng: 73.7997 },
  { name: 'Pimple Nilakh', zone: 'PCMC', pincode: '411027', lat: 18.5786, lng: 73.7951 },
  { name: 'Ravet', zone: 'PCMC', pincode: '412101', lat: 18.6534, lng: 73.7378 },
  { name: 'Pimpri', zone: 'PCMC', pincode: '411017', lat: 18.6279, lng: 73.7997 },
  { name: 'Chinchwad', zone: 'PCMC', pincode: '411033', lat: 18.6298, lng: 73.7844 },
  { name: 'Moshi', zone: 'PCMC', pincode: '412105', lat: 18.6738, lng: 73.8443 },

  // Central Pune
  { name: 'Shivajinagar', zone: 'Central', pincode: '411005', lat: 18.5314, lng: 73.8446 },
  { name: 'Deccan Gymkhana', zone: 'Central', pincode: '411004', lat: 18.5173, lng: 73.8415 },
  { name: 'Camp / Pune Cantonment', zone: 'Central', pincode: '411001', lat: 18.5133, lng: 73.8797 },
  { name: 'Swargate', zone: 'Central', pincode: '411042', lat: 18.5018, lng: 73.8586 },
  { name: 'Sadashiv Peth', zone: 'Central', pincode: '411030', lat: 18.5113, lng: 73.8492 },

  // South Pune
  { name: 'Bibvewadi', zone: 'South', pincode: '411037', lat: 18.4728, lng: 73.8643 },
  { name: 'Kondhwa', zone: 'South', pincode: '411048', lat: 18.4746, lng: 73.8940 },
  { name: 'Undri', zone: 'South', pincode: '411060', lat: 18.4619, lng: 73.9114 },
  { name: 'NIBM Road', zone: 'South', pincode: '411048', lat: 18.4837, lng: 73.8967 },
  { name: 'Katraj', zone: 'South', pincode: '411046', lat: 18.4575, lng: 73.8677 },
  { name: 'Ambegaon Budruk', zone: 'South', pincode: '411046', lat: 18.4552, lng: 73.8378 },
  { name: 'Dhanori', zone: 'North', pincode: '411015', lat: 18.5937, lng: 73.8913 },
  { name: 'Tingre Nagar', zone: 'North', pincode: '411015', lat: 18.5772, lng: 73.8821 },
  { name: 'Vishrantwadi', zone: 'North', pincode: '411015', lat: 18.5668, lng: 73.8767 },
];

export const VALID_PUNE_PINCODES = new Set(PUNE_LOCALITIES.map((l) => l.pincode));

/**
 * Validates whether the given coordinate falls within the strictly enforced Pune region bounds.
 */
export function isWithinPuneBounds(lat: number, lng: number): boolean {
  return (
    lat >= PUNE_BOUNDS.minLat &&
    lat <= PUNE_BOUNDS.maxLat &&
    lng >= PUNE_BOUNDS.minLng &&
    lng <= PUNE_BOUNDS.maxLng
  );
}

/**
 * Validates whether the given pincode is a verified Pune postal code.
 */
export function isValidPunePincode(pincode: string): boolean {
  const clean = pincode.trim();
  // Pune postal codes range from 411001 to 411062, plus peripheral Pune PCMC/district areas 412xxx
  if (!/^\d{6}$/.test(clean)) return false;
  return clean.startsWith('411') || clean.startsWith('412');
}

/**
 * Content moderation filter to detect embedded contact numbers, emails, or handles
 * to ensure users cannot bypass the broker.
 */
export function detectContactInfo(text: string): { containsContact: boolean; matches: string[] } {
  if (!text) return { containsContact: false, matches: [] };
  const matches: string[] = [];

  // 1. Email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emailMatches = text.match(emailRegex);
  if (emailMatches) {
    matches.push(...emailMatches.map((m) => `Email: ${m}`));
  }

  // 2. Indian 10-digit mobile number variations (e.g., 9822012345, +91 98220 12345, 9822-012-345)
  const phoneRegex = /(?:\+?91[\s-]?)?[6-9]\d{9}|(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}/g;
  const phoneMatches = text.match(phoneRegex);
  if (phoneMatches) {
    matches.push(...phoneMatches.map((m) => `Phone: ${m}`));
  }

  // 3. Common social / direct contact keywords like @handle, insta, whatsapp: 9xxx
  const handleRegex = /(?:whatsapp|wa\.me|instagram|insta|call me at|reach me at|ping me at)[:\s]+[^\s,]+/gi;
  const handleMatches = text.match(handleRegex);
  if (handleMatches) {
    matches.push(...handleMatches);
  }

  return {
    containsContact: matches.length > 0,
    matches,
  };
}
