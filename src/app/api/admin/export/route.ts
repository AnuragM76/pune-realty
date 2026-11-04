import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAdminAction } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'inquiries' | 'listings'
    const includeOwner = searchParams.get('includeOwner') === 'true';

    if (type === 'inquiries') {
      const res = await pool.query(`
        SELECT i.id, i.name, i.phone, i.email, i.message, i.preferred_visit_time,
               i.status, i.broker_notes, i.created_at, l.title as property_title,
               l.locality as property_locality, l.price as property_price
        FROM inquiries i
        JOIN listings l ON l.id = i.listing_id
        ORDER BY i.created_at DESC;
      `);

      // CSV Generation
      const headers = ['Inquiry ID', 'Name', 'Phone', 'Email', 'Message', 'Visit Time', 'Status', 'Property Title', 'Locality', 'Price', 'Date'];
      const rows = res.rows.map((r) => [
        r.id,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.phone}"`,
        `"${r.email}"`,
        `"${r.message.replace(/"/g, '""')}"`,
        `"${r.preferred_visit_time || ''}"`,
        r.status,
        `"${r.property_title.replace(/"/g, '""')}"`,
        `"${r.property_locality}"`,
        r.property_price,
        `"${new Date(r.created_at).toISOString()}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      await logAdminAction(auth.userId, 'EXPORT_CSV', 'inquiries', null, { count: res.rows.length });

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="pune-realty-inquiries-${Date.now()}.csv"`,
        },
      });
    }

    // Default to listings export
    // OWNER DATA PRIVACY RULE: Excluded unless admin explicitly checked includeOwner
    let query = `
      SELECT l.id, l.title, l.listing_type, l.property_category, l.bhk, l.carpet_area_sqft,
             l.price, l.deposit, l.locality, l.pincode, l.status, l.created_at
    `;
    if (includeOwner) {
      query += `, o.owner_name, o.owner_phone, o.owner_email, o.notes as owner_notes`;
    }
    query += `
      FROM listings l
      LEFT JOIN owner_details o ON o.listing_id = l.id
      WHERE l.is_deleted = FALSE
      ORDER BY l.created_at DESC;
    `;

    const res = await pool.query(query);

    const headers = ['ID', 'Title', 'Type', 'Category', 'BHK', 'Carpet SqFt', 'Price', 'Deposit', 'Locality', 'Pincode', 'Status', 'Date'];
    if (includeOwner) {
      headers.push('Owner Name', 'Owner Phone', 'Owner Email', 'Owner Notes');
    }

    const rows = res.rows.map((r) => {
      const base = [
        r.id,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        r.listing_type,
        r.property_category,
        `"${r.bhk || ''}"`,
        r.carpet_area_sqft,
        r.price,
        r.deposit || 0,
        `"${r.locality}"`,
        `"${r.pincode}"`,
        r.status,
        `"${new Date(r.created_at).toISOString()}"`
      ];
      if (includeOwner) {
        base.push(
          `"${(r.owner_name || '').replace(/"/g, '""')}"`,
          `"${r.owner_phone || ''}"`,
          `"${r.owner_email || ''}"`,
          `"${(r.owner_notes || '').replace(/"/g, '""')}"`
        );
      }
      return base.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    await logAdminAction(auth.userId, 'EXPORT_CSV', 'listings', null, { count: res.rows.length, includeOwner });

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="pune-realty-listings-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export CSV.' }, { status: 500 });
  }
}
