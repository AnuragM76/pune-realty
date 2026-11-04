import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';

// 1. Sign Up Endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, password } = body;

    // Validation
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields (name, email, phone, password) are required.' }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const phoneClean = phone.replace(/\D/g, '');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Validate 10-digit Indian phone
    if (phoneClean.length !== 10 || !['6', '7', '8', '9'].includes(phoneClean[0])) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // Check unique email or phone
    const existing = await pool.query(
      'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2',
      [emailTrimmed, phoneClean]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.email === emailTrimmed) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: 'An account with this phone number already exists.' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, email, phone, role, created_at`,
      [name.trim(), emailTrimmed, phoneClean, passwordHash]
    );

    const newUser = result.rows[0];
    const token = generateAccessToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });
    const refreshToken = generateRefreshToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      token,
    }, { status: 201 });

    response.cookies.set('punerealty_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours
    });

    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error while creating account.' }, { status: 500 });
  }
}
