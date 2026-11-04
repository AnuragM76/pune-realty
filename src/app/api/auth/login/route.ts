import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email or phone and password are required.' }, { status: 400 });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, '');

    // Query user by email OR 10-digit phone
    const res = await pool.query(
      `SELECT id, name, email, phone, password_hash, role, is_active
       FROM users
       WHERE email = $1 OR (phone = $2 AND length($2) = 10)`,
      [cleanInput, cleanPhone]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid login credentials.' }, { status: 401 });
    }

    const user = res.rows[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'This account has been deactivated. Please contact support.' }, { status: 403 });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid login credentials.' }, { status: 401 });
    }

    const token = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token,
      refreshToken,
    });

    response.cookies.set('punerealty_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'An error occurred during login.' }, { status: 500 });
  }
}
