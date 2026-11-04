import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAdminAction } from '@/lib/auth';
import { serializePublicListing, serializeAdminListing } from '@/lib/serializers';
import { isWithinPuneBounds, isValidPunePincode, detectContactInfo } from '@/lib/puneData';

/**
 * GET /api/listings
 * Public and Filtered Property Search
 * Strictly restricted to Pune listings.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auth = await getAuthUser(req);
    const isAdmin = auth?.role === 'admin';

    // Filters
    const listingType = searchParams.get('listingType'); // 'Sale' | 'Rent'
    const propertyCategory = searchParams.get('category');
    const locality = searchParams.get('locality');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bhk = searchParams.get('bhk');
    const furnishing = searchParams.get('furnishing');
    const possession = searchParams.get('possession');
    const facing = searchParams.get('facing');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    const amenity = searchParams.get('amenity');
    const queryTerm = searchParams.get('q');
    const sort = searchParams.get('sort') || 'newest'; // 'newest' | 'price_asc' | 'price_desc' | 'relevance'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const offset = (page - 1) * limit;

    // View bounds (for Map sync)
    const south = searchParams.get('south');
    const north = searchParams.get('north');
    const west = searchParams.get('west');
    const east = searchParams.get('east');

    // Base query
    let whereClauses = ['l.is_deleted = FALSE'];
    const params: any[] = [];
    let pIdx = 1;

    // For non-admin, ONLY return approved listings
    if (!isAdmin) {
      whereClauses.push("l.status = 'approved'");
    } else {
      const statusFilter = searchParams.get('status');
      if (statusFilter && statusFilter !== 'all') {
        whereClauses.push(`l.status = $${pIdx++}`);
        params.push(statusFilter);
      }
    }

    if (listingType && ['Sale', 'Rent'].includes(listingType)) {
      whereClauses.push(`l.listing_type = $${pIdx++}`);
      params.push(listingType);
    }

    if (propertyCategory) {
      whereClauses.push(`l.property_category = $${pIdx++}`);
      params.push(propertyCategory);
    }

    if (locality) {
      whereClauses.push(`l.locality ILIKE $${pIdx++}`);
      params.push(`%${locality}%`);
    }

    if (minPrice) {
      whereClauses.push(`l.price >= $${pIdx++}`);
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      whereClauses.push(`l.price <= $${pIdx++}`);
      params.push(Number(maxPrice));
    }

    if (bhk) {
      whereClauses.push(`l.bhk = $${pIdx++}`);
      params.push(bhk);
    }

    if (furnishing) {
      whereClauses.push(`l.furnishing_status = $${pIdx++}`);
      params.push(furnishing);
    }

    if (possession) {
      whereClauses.push(`l.possession_status ILIKE $${pIdx++}`);
      params.push(`%${possession}%`);
    }

    if (facing) {
      whereClauses.push(`l.facing_direction = $${pIdx++}`);
      params.push(facing);
    }

    if (minArea) {
      whereClauses.push(`l.carpet_area_sqft >= $${pIdx++}`);
      params.push(Number(minArea));
    }
    if (maxArea) {
      whereClauses.push(`l.carpet_area_sqft <= $${pIdx++}`);
      params.push(Number(maxArea));
    }

    // Map bounds sync filter
    if (south && north && west && east) {
      whereClauses.push(
        `l.lat >= $${pIdx++} AND l.lat <= $${pIdx++} AND l.lng >= $${pIdx++} AND l.lng <= $${pIdx++}`
      );
      params.push(Number(south), Number(north), Number(west), Number(east));
    }

    // Full-text search
    if (queryTerm) {
      whereClauses.push(`(
        l.title ILIKE $${pIdx} OR 
        l.description ILIKE $${pIdx} OR 
        l.locality ILIKE $${pIdx} OR 
        l.address ILIKE $${pIdx}
      )`);
      params.push(`%${queryTerm}%`);
      pIdx++;
    }

    // Amenity filter
    let joinAmenities = '';
    if (amenity) {
      joinAmenities = `
        INNER JOIN listing_amenities la_f ON la_f.listing_id = l.id
        INNER JOIN amenities a_f ON a_f.id = la_f.amenity_id AND a_f.name ILIKE $${pIdx++}
      `;
      params.push(amenity);
    }

    let orderBy = 'l.is_featured DESC, l.created_at DESC';
    if (sort === 'price_asc') orderBy = 'l.price ASC';
    if (sort === 'price_desc') orderBy = 'l.price DESC';
    if (sort === 'oldest') orderBy = 'l.created_at ASC';

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching
    const countSql = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM listings l
      ${joinAmenities}
      ${whereStr}
    `;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0');

    // Query listings with aggregate images and amenities
    // STRICT RULE: We only join owner_details if requester is verified ADMIN
    const selectOwnerCols = isAdmin
      ? `, o.id as owner_detail_id, o.owner_name, o.owner_phone, o.owner_email, o.owner_address, o.notes as owner_notes,
           u.name as user_name, u.email as user_email, u.phone as user_phone`
      : '';
    const joinOwner = isAdmin
      ? `LEFT JOIN owner_details o ON o.listing_id = l.id
         LEFT JOIN users u ON u.id = l.user_id`
      : '';

    const listSql = `
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
        ${selectOwnerCols}
      FROM listings l
      ${joinAmenities}
      ${joinOwner}
      ${whereStr}
      ORDER BY ${orderBy}
      LIMIT $${pIdx++} OFFSET $${pIdx++}
    `;

    const listParams = [...params, limit, offset];
    const listingsRes = await pool.query(listSql, listParams);

    const serialized = listingsRes.rows.map((row) =>
      isAdmin ? serializeAdminListing(row) : serializePublicListing(row)
    );

    return NextResponse.json({
      success: true,
      data: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Listings GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve listings.' }, { status: 500 });
  }
}

/**
 * POST /api/listings
 * Create new property listing
 * Strict Pune validation & Owner privacy enforcement.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Please log in to submit a property listing.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      listingType,
      propertyCategory,
      bhk,
      carpetAreaSqft,
      builtupAreaSqft,
      floorNumber,
      totalFloors,
      ageOfProperty,
      facingDirection,
      furnishingStatus,
      bathrooms,
      balconies,
      parking,
      possessionStatus,
      possessionDate,
      price,
      deposit,
      maintenanceCharges,
      isNegotiable,
      locality,
      address,
      pincode,
      lat,
      lng,
      preferredTenants,
      description,
      videoUrl,
      coverImage,
      images, // array of url strings
      amenities, // array of amenity names
      // Owner private details
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerAddress,
      ownerNotes,
    } = body;

    // 1. Mandatory Fields
    if (!title || !listingType || !propertyCategory || !carpetAreaSqft || !price || !locality || !address || !pincode) {
      return NextResponse.json({ error: 'Missing required property information.' }, { status: 400 });
    }

    // 2. Listing Type Restriction: Sale or Rent only
    if (!['Sale', 'Rent'].includes(listingType)) {
      return NextResponse.json({ error: 'Only Sale and Rent listing types are supported.' }, { status: 400 });
    }

    // 3. Category Restriction: Flats, Villas, Independent houses, Plot, Office, Shop, Warehouse
    const validCategories = [
      'Apartment/Flat',
      'Independent House',
      'Villa',
      'Plot/Land',
      'Office',
      'Shop',
      'Warehouse'
    ];
    if (!validCategories.includes(propertyCategory)) {
      return NextResponse.json({ error: 'Invalid property category.' }, { status: 400 });
    }

    // 4. Strict Pune Geography Validation
    const cleanPincode = String(pincode).trim();
    if (!isValidPunePincode(cleanPincode)) {
      return NextResponse.json({
        error: `Pincode ${cleanPincode} is outside Pune. Only verified Pune pincodes (starting with 411 or 412) are allowed.`
      }, { status: 400 });
    }

    const latitude = Number(lat || 18.5204);
    const longitude = Number(lng || 73.8567);
    if (!isWithinPuneBounds(latitude, longitude)) {
      return NextResponse.json({
        error: 'Location coordinates fall outside Pune boundary limits (Lat: 18.30-18.75, Lng: 73.65-74.15).'
      }, { status: 400 });
    }

    // 5. Anti-Bypass Content Moderation: Scan for embedded phones, emails, or handles
    const scanResult = detectContactInfo(`${title} ${description}`);
    const hasContactLeakFlag = scanResult.containsContact;
    const contactLeakNotes = hasContactLeakFlag
      ? `Auto-moderation flag: detected contact patterns (${scanResult.matches.join('; ')})`
      : null;

    // 6. Owner contact validation
    const ownerNameClean = ownerName ? String(ownerName).trim() : auth.name;
    const ownerPhoneClean = ownerPhone ? String(ownerPhone).trim() : '';

    // Admin created listings are auto-approved; registered user listings require review
    const isAdmin = auth.role === 'admin';
    const status = isAdmin ? 'approved' : 'pending';

    // Auto calculate price per sq ft
    const pricePerSqft = carpetAreaSqft ? Math.round(Number(price) / Number(carpetAreaSqft)) : null;

    // Generate unique slug
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug}-${randomSuffix}`;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const insertListingSql = `
        INSERT INTO listings (
          user_id, title, slug, listing_type, property_category, bhk,
          carpet_area_sqft, builtup_area_sqft, floor_number, total_floors,
          age_of_property, facing_direction, furnishing_status, bathrooms,
          balconies, parking, possession_status, possession_date, price, deposit,
          maintenance_charges, price_per_sqft, is_negotiable, locality, address,
          pincode, lat, lng, preferred_tenants, description, has_contact_leak_flag,
          contact_leak_notes, video_url, cover_image, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25,
          $26, $27, $28, $29, $30, $31,
          $32, $33, $34, $35
        ) RETURNING *;
      `;

      const listingRes = await client.query(insertListingSql, [
        auth.userId,
        title.trim(),
        slug,
        listingType,
        propertyCategory,
        bhk || null,
        Number(carpetAreaSqft),
        builtupAreaSqft ? Number(builtupAreaSqft) : null,
        floorNumber !== undefined && floorNumber !== null ? Number(floorNumber) : null,
        totalFloors !== undefined && totalFloors !== null ? Number(totalFloors) : null,
        ageOfProperty || null,
        facingDirection || null,
        furnishingStatus || 'Unfurnished',
        bathrooms ? Number(bathrooms) : 1,
        balconies ? Number(balconies) : 0,
        parking || null,
        possessionStatus || 'Ready to Move',
        possessionDate ? new Date(possessionDate) : null,
        Number(price),
        deposit ? Number(deposit) : 0,
        maintenanceCharges ? Number(maintenanceCharges) : 0,
        pricePerSqft,
        Boolean(isNegotiable),
        locality.trim(),
        address.trim(),
        cleanPincode,
        latitude,
        longitude,
        preferredTenants || 'Any',
        description.trim(),
        hasContactLeakFlag,
        contactLeakNotes,
        videoUrl || null,
        coverImage || (images && images[0]) || null,
        status,
      ]);

      const newListing = listingRes.rows[0];

      // Store STRICTLY PRIVATE Owner Details
      await client.query(`
        INSERT INTO owner_details (listing_id, owner_name, owner_phone, owner_email, owner_address, notes)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [
        newListing.id,
        ownerNameClean,
        ownerPhoneClean,
        ownerEmail || null,
        ownerAddress || null,
        ownerNotes || null,
      ]);

      // Save Gallery Images (up to 15 photos)
      if (Array.isArray(images)) {
        for (let i = 0; i < Math.min(images.length, 15); i++) {
          await client.query(`
            INSERT INTO listing_images (listing_id, url, display_order)
            VALUES ($1, $2, $3);
          `, [newListing.id, images[i], i]);
        }
      }

      // Save Amenities
      if (Array.isArray(amenities)) {
        for (const am of amenities) {
          const amRes = await client.query('SELECT id FROM amenities WHERE name = $1', [am]);
          if (amRes.rows.length > 0) {
            await client.query(`
              INSERT INTO listing_amenities (listing_id, amenity_id)
              VALUES ($1, $2) ON CONFLICT DO NOTHING;
            `, [newListing.id, amRes.rows[0].id]);
          }
        }
      }

      await client.query('COMMIT');

      // Log admin audit
      if (isAdmin) {
        await logAdminAction(auth.userId, 'CREATE_LISTING', 'listing', newListing.id, {
          title: newListing.title,
          status: newListing.status,
        });
      }

      return NextResponse.json({
        success: true,
        message: isAdmin
          ? 'Listing published immediately!'
          : 'Listing submitted successfully for broker review.',
        data: serializePublicListing(newListing),
      }, { status: 201 });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Failed to create listing:', err);
      return NextResponse.json({ error: 'Failed to create listing in database.' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('POST listing error:', error);
    return NextResponse.json({ error: 'Server error processing listing creation.' }, { status: 500 });
  }
}
