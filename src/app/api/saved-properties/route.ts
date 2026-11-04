import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { serializePublicListing } from '@/lib/serializers';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Please log in to view saved properties.' }, { status: 401 });
    }

    const sql = `
      SELECT l.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url) ORDER BY img.display_order ASC)
           FROM listing_images img WHERE img.listing_id = l.id), '[]'::json
        ) as images
      FROM saved_properties sp
      JOIN listings l ON l.id = sp.listing_id
      WHERE sp.user_id = $1 AND l.is_deleted = FALSE
      ORDER BY sp.created_at DESC;
    `;
    const res = await pool.query(sql, [auth.userId]);
    const serialized = res.rows.map((r) => serializePublicListing(r));

    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch saved properties.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Please log in to save properties.' }, { status: 401 });
    }

    const { listingId } = await req.json();
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required.' }, { status: 400 });
    }

    // Toggle saved state
    const check = await pool.query('SELECT id FROM saved_properties WHERE user_id = $1 AND listing_id = $2', [auth.userId, listingId]);

    if (check.rows.length > 0) {
      await pool.query('DELETE FROM saved_properties WHERE user_id = $1 AND listing_id = $2', [auth.userId, listingId]);
      return NextResponse.json({ success: true, saved: false, message: 'Property removed from saved.' });
    } else {
      await pool.query('INSERT INTO saved_properties (user_id, listing_id) VALUES ($1, $2)', [auth.userId, listingId]);
      return NextResponse.json({ success: true, saved: true, message: 'Property saved successfully.' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update saved property.' }, { status: 500 });
  }
}
