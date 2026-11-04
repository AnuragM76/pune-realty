import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ user: null });
    }

    const res = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [auth.userId]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: res.rows[0] });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, password } = body;

    let updateQuery = 'UPDATE users SET updated_at = NOW()';
    const params: any[] = [];
    let idx = 1;

    if (name) {
      updateQuery += `, name = $${idx++}`;
      params.push(name.trim());
    }

    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Valid 10-digit phone number is required.' }, { status: 400 });
      }
      updateQuery += `, phone = $${idx++}`;
      params.push(cleanPhone);
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
      }
      const hash = await hashPassword(password);
      updateQuery += `, password_hash = $${idx++}`;
      params.push(hash);
    }

    updateQuery += ` WHERE id = $${idx} RETURNING id, name, email, phone, role`;
    params.push(auth.userId);

    const res = await pool.query(updateQuery, params);
    return NextResponse.json({ success: true, user: res.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}
