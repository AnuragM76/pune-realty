import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { serializePublicListing } from '@/lib/serializers';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = `
      SELECT l.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', img.id, 'url', img.url) ORDER BY img.display_order ASC)
           FROM listing_images img WHERE img.listing_id = l.id), '[]'::json
        ) as images
      FROM listings l
      WHERE l.user_id = $1 AND l.is_deleted = FALSE
      ORDER BY l.created_at DESC;
    `;

    const res = await pool.query(sql, [auth.userId]);
    const serialized = res.rows.map((r) => serializePublicListing(r));

    return NextResponse.json({ success: true, data: serialized });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user listings.' }, { status: 500 });
  }
}
