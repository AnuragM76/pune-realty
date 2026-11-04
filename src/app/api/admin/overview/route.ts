import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthUser, logAdminAction } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    // 1. Overview counts
    const totalListings = await pool.query('SELECT count(*) FROM listings WHERE is_deleted = FALSE');
    const pendingListings = await pool.query("SELECT count(*) FROM listings WHERE status = 'pending' AND is_deleted = FALSE");
    const todayInquiries = await pool.query("SELECT count(*) FROM inquiries WHERE created_at >= CURRENT_DATE");
    const activeUsers = await pool.query("SELECT count(*) FROM users WHERE is_active = TRUE AND role = 'user'");
    const totalInquiries = await pool.query('SELECT count(*) FROM inquiries');

    // 2. Recent audit logs
    const auditLogs = await pool.query(`
      SELECT al.*, u.name as admin_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.admin_id
      ORDER BY al.created_at DESC
      LIMIT 10;
    `);

    // 3. Settings
    const settings = await pool.query('SELECT key, value, description FROM platform_settings');

    return NextResponse.json({
      success: true,
      stats: {
        totalListings: parseInt(totalListings.rows[0].count),
        pendingApprovals: parseInt(pendingListings.rows[0].count),
        todayInquiries: parseInt(todayInquiries.rows[0].count),
        totalInquiries: parseInt(totalInquiries.rows[0].count),
        activeUsers: parseInt(activeUsers.rows[0].count),
      },
      recentLogs: auditLogs.rows,
      settings: settings.rows,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load dashboard metrics.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (!auth || auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { settings } = await req.json();
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await pool.query(
          `INSERT INTO platform_settings (key, value) VALUES ($1, $2)
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;`,
          [key, String(value)]
        );
      }
      await logAdminAction(auth.userId, 'UPDATE_SETTINGS', 'settings', null, settings);
    }

    return NextResponse.json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings.' }, { status: 500 });
  }
}
