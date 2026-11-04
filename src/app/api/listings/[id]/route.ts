import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAdminAction } from '@/lib/auth';
import { serializePublicListing, serializeAdminListing } from '@/lib/serializers';
import { isWithinPuneBounds, isValidPunePincode, detectContactInfo } from '@/lib/puneData';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.id;
    const auth = await getAuthUser(req);
    const isAdmin = auth?.role === 'admin';

    const isNumeric = /^\d+$/.test(identifier);
    const lookupClause = isNumeric ? 'l.id = $1' : 'l.slug = $1';

    const selectOwnerCols = isAdmin
      ? `, o.id as owner_detail_id, o.owner_name, o.owner_phone, o.owner_email, o.owner_address, o.notes as owner_notes,
           u.name as user_name, u.email as user_email, u.phone as user_phone`
      : '';
    const joinOwner = isAdmin
      ? `LEFT JOIN owner_details o ON o.listing_id = l.id
         LEFT JOIN users u ON u.id = l.user_id`
      : '';

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
        ${selectOwnerCols}
      FROM listings l
      ${joinOwner}
      WHERE ${lookupClause} AND l.is_deleted = FALSE;
    `;

    const res = await pool.query(sql, [identifier]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const row = res.rows[0];

    // If not admin and listing is not approved, only author can view it
    if (!isAdmin && row.status !== 'approved') {
      if (!auth || auth.userId !== row.user_id) {
        return NextResponse.json({ error: 'Property not found or under review.' }, { status: 404 });
      }
    }

    // Increment views count non-blockingly
    pool.query('UPDATE listings SET views_count = views_count + 1 WHERE id = $1', [row.id]).catch(() => {});

    // Fetch similar properties in Pune (same locality or type)
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
      LIMIT 4;
    `;
    const similarRes = await pool.query(similarSql, [row.id, row.locality, row.listing_type]);
    const serializedSimilar = similarRes.rows.map((r) => serializePublicListing(r));

    const result = isAdmin ? serializeAdminListing(row) : serializePublicListing(row);

    return NextResponse.json({
      success: true,
      data: result,
      similar: serializedSimilar,
    });
  } catch (error) {
    console.error('Property detail GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve property details.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const auth = await getAuthUser(req);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkRes = await pool.query('SELECT user_id, status FROM listings WHERE id = $1 AND is_deleted = FALSE', [id]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const existing = checkRes.rows[0];
    const isAdmin = auth.role === 'admin';
    const isOwner = auth.userId === existing.user_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'You do not have permission to edit this listing.' }, { status: 403 });
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
      price,
      deposit,
      maintenanceCharges,
      locality,
      address,
      pincode,
      lat,
      lng,
      preferredTenants,
      description,
      status, // Admin can set status
      rejectionReason,
      isFeatured,
      // Private owner update
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerNotes,
    } = body;

    // Validate Pune bounds if coordinates or pincode changed
    if (pincode && !isValidPunePincode(String(pincode))) {
      return NextResponse.json({ error: 'Pincode must be within Pune (411xxx or 412xxx).' }, { status: 400 });
    }
    if (lat && lng && !isWithinPuneBounds(Number(lat), Number(lng))) {
      return NextResponse.json({ error: 'Coordinates fall outside Pune boundaries.' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let updateStatus = existing.status;
      if (isAdmin && status) {
        updateStatus = status;
      } else if (!isAdmin && isOwner && existing.status === 'rejected') {
        // User resubmits rejected listing -> becomes pending
        updateStatus = 'pending';
      }

      // Check contact leak
      const scanResult = detectContactInfo(`${title || ''} ${description || ''}`);

      await client.query(`
        UPDATE listings SET
          title = COALESCE($1, title),
          listing_type = COALESCE($2, listing_type),
          property_category = COALESCE($3, property_category),
          bhk = COALESCE($4, bhk),
          carpet_area_sqft = COALESCE($5, carpet_area_sqft),
          builtup_area_sqft = COALESCE($6, builtup_area_sqft),
          floor_number = COALESCE($7, floor_number),
          total_floors = COALESCE($8, total_floors),
          age_of_property = COALESCE($9, age_of_property),
          facing_direction = COALESCE($10, facing_direction),
          furnishing_status = COALESCE($11, furnishing_status),
          bathrooms = COALESCE($12, bathrooms),
          balconies = COALESCE($13, balconies),
          parking = COALESCE($14, parking),
          possession_status = COALESCE($15, possession_status),
          price = COALESCE($16, price),
          deposit = COALESCE($17, deposit),
          maintenance_charges = COALESCE($18, maintenance_charges),
          locality = COALESCE($19, locality),
          address = COALESCE($20, address),
          pincode = COALESCE($21, pincode),
          lat = COALESCE($22, lat),
          lng = COALESCE($23, lng),
          preferred_tenants = COALESCE($24, preferred_tenants),
          description = COALESCE($25, description),
          status = $26,
          rejection_reason = COALESCE($27, rejection_reason),
          is_featured = COALESCE($28, is_featured),
          has_contact_leak_flag = $29,
          updated_at = NOW()
        WHERE id = $30;
      `, [
        title, listingType, propertyCategory, bhk,
        carpetAreaSqft ? Number(carpetAreaSqft) : null,
        builtupAreaSqft ? Number(builtupAreaSqft) : null,
        floorNumber !== undefined ? Number(floorNumber) : null,
        totalFloors !== undefined ? Number(totalFloors) : null,
        ageOfProperty, facingDirection, furnishingStatus,
        bathrooms !== undefined ? Number(bathrooms) : null,
        balconies !== undefined ? Number(balconies) : null,
        parking, possessionStatus,
        price ? Number(price) : null,
        deposit ? Number(deposit) : null,
        maintenanceCharges ? Number(maintenanceCharges) : null,
        locality, address, pincode,
        lat ? Number(lat) : null,
        lng ? Number(lng) : null,
        preferredTenants, description,
        updateStatus,
        rejectionReason || null,
        isAdmin && isFeatured !== undefined ? Boolean(isFeatured) : null,
        scanResult.containsContact,
        id,
      ]);

      // If owner info updated
      if (ownerName || ownerPhone) {
        await client.query(`
          INSERT INTO owner_details (listing_id, owner_name, owner_phone, owner_email, notes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (listing_id) DO UPDATE SET
            owner_name = COALESCE($2, owner_details.owner_name),
            owner_phone = COALESCE($3, owner_details.owner_phone),
            owner_email = COALESCE($4, owner_details.owner_email),
            notes = COALESCE($5, owner_details.notes);
        `, [id, ownerName, ownerPhone, ownerEmail || null, ownerNotes || null]);
      }

      await client.query('COMMIT');

      if (isAdmin) {
        await logAdminAction(auth.userId, 'UPDATE_LISTING', 'listing', id, { status: updateStatus, body });
      }

      return NextResponse.json({ success: true, message: 'Listing updated successfully.' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Update listing error:', err);
      return NextResponse.json({ error: 'Failed to update listing.' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const auth = await getAuthUser(req);

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkRes = await pool.query('SELECT user_id FROM listings WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const isAdmin = auth.role === 'admin';
    const isOwner = auth.userId === checkRes.rows[0].user_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete listing
    await pool.query('UPDATE listings SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1', [id]);

    if (isAdmin) {
      await logAdminAction(auth.userId, 'DELETE_LISTING', 'listing', id, { softDelete: true });
    }

    return NextResponse.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete listing.' }, { status: 500 });
  }
}
