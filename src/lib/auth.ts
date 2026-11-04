import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import pool from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'pune_realestate_jwt_secret_dev_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'pune_realestate_refresh_secret_dev_key_2026';

export interface TokenPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
  name: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the current session user from the incoming request Authorization header or cookie.
 */
export async function getAuthUser(req: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  // 1. Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Cookie fallback
  if (!token) {
    token = req.cookies.get('punerealty_token')?.value;
  }

  if (!token) return null;

  const payload = verifyAccessToken(token);
  if (!payload) return null;

  // Verify user is active in DB
  const res = await pool.query('SELECT id, is_active, role FROM users WHERE id = $1', [payload.userId]);
  if (res.rows.length === 0 || !res.rows[0].is_active) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: res.rows[0].role,
    name: payload.name,
  };
}

/**
 * Audit log logger for admin actions
 */
export async function logAdminAction(
  adminId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details: any,
  ip?: string
) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, action, entityType, entityId, JSON.stringify(details), ip || null]
    );
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}
