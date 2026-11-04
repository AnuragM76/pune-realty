import { NextResponse } from 'next/server';
import { PUNE_LOCALITIES, PUNE_BOUNDS } from '@/lib/puneData';

export async function GET() {
  return NextResponse.json({
    city: 'Pune',
    state: 'Maharashtra',
    bounds: PUNE_BOUNDS,
    localities: PUNE_LOCALITIES,
  });
}
