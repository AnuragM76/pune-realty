import { serializePublicListing, serializeAdminListing } from './serializers';

describe('Owner Data Privacy and Contact Protection Tests', () => {
  const mockRawDbRowWithPrivateOwner = {
    id: 101,
    user_id: 5,
    user_name: 'John Registered User',
    user_email: 'john.user@example.com',
    user_phone: '9876543210',
    title: 'Spacious 3 BHK Luxury Apartment in Baner',
    slug: 'spacious-3-bhk-luxury-apartment-in-baner-101',
    listing_type: 'Sale',
    property_category: 'Apartment/Flat',
    bhk: '3 BHK',
    carpet_area_sqft: 1450,
    price: 15500000,
    locality: 'Baner',
    address: 'Near Balewadi High Street, Baner, Pune',
    pincode: '411045',
    lat: 18.5590,
    lng: 73.7868,
    status: 'approved',
    // SENSITIVE OWNER DATA (MUST NEVER BE LEAKED TO PUBLIC API)
    owner_name: 'Mr. Ramesh Kulkarni (Secret Landlord)',
    owner_phone: '9822998877',
    owner_email: 'ramesh.kulkarni.private@gmail.com',
    owner_address: 'Flat 501, Royal Palms, Pune',
    owner_notes: 'Owner wants immediate settlement, negotiable by 2L',
    has_contact_leak_flag: false,
    contact_leak_notes: null,
  };

  test('serializePublicListing MUST NEVER include owner details or private user details', () => {
    const serialized = serializePublicListing(mockRawDbRowWithPrivateOwner);

    // 1. Verify owner details are absent
    expect((serialized as any).ownerDetails).toBeUndefined();
    expect((serialized as any).owner_name).toBeUndefined();
    expect((serialized as any).owner_phone).toBeUndefined();
    expect((serialized as any).owner_email).toBeUndefined();
    expect((serialized as any).owner_address).toBeUndefined();
    expect((serialized as any).owner_notes).toBeUndefined();

    // 2. Verify registered user contact details are absent
    expect((serialized as any).user_email).toBeUndefined();
    expect((serialized as any).user_phone).toBeUndefined();
    expect((serialized as any).userId).toBeUndefined();

    // 3. Verify public listing ONLY displays Broker's contact
    expect(serialized.broker).toBeDefined();
    expect(serialized.broker.phone).toBe('+91 98220 12345');
    expect(serialized.broker.email).toBe('contact@puneprimeproperties.in');

    // 4. Verify JSON stringification contains no trace of owner phone or email
    const jsonString = JSON.stringify(serialized);
    expect(jsonString).not.toContain('9822998877');
    expect(jsonString).not.toContain('ramesh.kulkarni.private@gmail.com');
    expect(jsonString).not.toContain('Ramesh Kulkarni');
  });

  test('serializeAdminListing includes owner details exclusively for the broker admin', () => {
    const adminSerialized = serializeAdminListing(mockRawDbRowWithPrivateOwner);

    expect(adminSerialized.ownerDetails).toBeDefined();
    expect(adminSerialized.ownerDetails?.ownerName).toBe('Mr. Ramesh Kulkarni (Secret Landlord)');
    expect(adminSerialized.ownerDetails?.ownerPhone).toBe('9822998877');
    expect(adminSerialized.ownerDetails?.ownerEmail).toBe('ramesh.kulkarni.private@gmail.com');
  });
});
