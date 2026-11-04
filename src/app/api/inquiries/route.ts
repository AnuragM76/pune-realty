import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAdminAction } from '@/lib/auth';

/**
 * Inquiries API:
 * - Public/Users: POST an inquiry routed exclusively to the broker
 * - Registered Users: GET their sent inquiries
 * - Admin (Broker): GET all platform inquiries with filter/search & PATCH status/notes
 */

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    const body = await req.json();
    const { listingId, name, phone, email, message, preferredVisitTime } = body;

    if (!listingId || !name || !phone || !email || !message) {
      return NextResponse.json({ error: 'Name, phone, email, and message are required.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    const listingRes = await pool.query('SELECT id, title, locality FROM listings WHERE id = $1 AND is_deleted = FALSE', [listingId]);
    if (listingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found.' }, { status: 404 });
    }

    const res = await pool.query(`
      INSERT INTO inquiries (listing_id, user_id, name, phone, email, message, preferred_visit_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `, [
      listingId,
      auth?.userId || null,
      name.trim(),
      cleanPhone,
      email.trim().toLowerCase(),
      message.trim(),
      preferredVisitTime || null,
    ]);

    // Simulated email dispatch to broker
    console.log(`[Broker Notification Email Sent] New inquiry for Property #${listingId} (${listingRes.rows[0].title}) from ${name} (${cleanPhone})`);

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been successfully sent to the Broker. They will contact you shortly.',
      inquiryId: res.rows[0].id,
    }, { status: 201 });
  } catch (error) {
    console.error('Inquiry submission error:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = auth.role === 'admin';
    const { searchParams } = new URL(req.url);

    if (isAdmin) {
      const status = searchParams.get('status');
      const propertyId = searchParams.get('propertyId');
      const q = searchParams.get('q');

      let whereClauses = ['1=1'];
      const params: any[] = [];
      let idx = 1;

      if (status && status !== 'all') {
        whereClauses.push(`i.status = $${idx++}`);
        params.push(status);
      }
      if (propertyId) {
        whereClauses.push(`i.listing_id = $${idx++}`);
        params.push(parseInt(propertyId));
      }
      if (q) {
        whereClauses.push(`(i.name ILIKE $${idx} OR i.phone ILIKE $${idx} OR i.email ILIKE $${idx} OR l.title ILIKE $${idx})`);
        params.push(`%${q}%`);
        idx++;
      }

      const sql = `
        SELECT i.*, l.title as property_title, l.locality as property_locality, l.price as property_price, l.listing_type as property_type
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY i.created_at DESC;
      `;
      const res = await pool.query(sql, params);
      return NextResponse.json({ success: true, data: res.rows });
    } else {
      // User viewing their own inquiries
      const res = await pool.query(`
        SELECT i.*, l.title as property_title, l.slug as property_slug, l.cover_image as property_image, l.locality as property_locality
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        WHERE i.user_id = $1
        ORDER BY i.created_at DESC;
      `, [auth.userId]);

      return NextResponse.json({ success: true, data: res.rows });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve inquiries.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id, status, brokerNotes } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Inquiry ID is required.' }, { status: 400 });
    }

    const res = await pool.query(`
      UPDATE inquiries SET
        status = COALESCE($1, status),
        broker_notes = COALESCE($2, broker_notes),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `, [status, brokerNotes, id]);

    await logAdminAction(auth.userId, 'UPDATE_INQUIRY', 'inquiry', id, { status, brokerNotes });

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inquiry.' }, { status: 500 });
  }
}
