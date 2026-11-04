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
    const q = searchParams.get('q');

    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active, u.created_at,
             COUNT(l.id) as listing_count
      FROM users u
      LEFT JOIN listings l ON l.user_id = u.id AND l.is_deleted = FALSE
    `;
    const params: any[] = [];

    if (q) {
      query += ` WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR u.phone ILIKE $1 `;
      params.push(`%${q}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC;`;

    const res = await pool.query(query, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { userId, isActive, role } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const res = await pool.query(
      `UPDATE users SET
         is_active = COALESCE($1, is_active),
         role = COALESCE($2, role),
         updated_at = NOW()
       WHERE id = $3 RETURNING id, name, email, phone, role, is_active`,
      [isActive !== undefined ? Boolean(isActive) : null, role || null, userId]
    );

    await logAdminAction(auth.userId, 'UPDATE_USER', 'user', userId, { isActive, role });

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
