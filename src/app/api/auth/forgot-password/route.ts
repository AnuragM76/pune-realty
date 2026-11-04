import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
      [token, expires, email.trim().toLowerCase()]
    );

    // In a production setup, this sends an email via Resend/SendGrid/SES.
    // For local evaluation, we return success and mock email dispatch.
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
      devResetToken: process.env.NODE_ENV !== 'production' ? token : undefined,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process forgot password request.' }, { status: 500 });
  }
}
