import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const [listingsCount, usersCount, localitiesCount, sampleListings] = await Promise.all([
      prisma.listing.count({ where: { is_deleted: false } }),
      prisma.user.count({ where: { is_active: true } }),
      prisma.puneLocality.count(),
      prisma.listing.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          locality: true,
          price: true,
          listing_type: true,
          property_category: true,
          // CRITICAL PRIVACY: owner_details is NOT queried publicly
        },
      }),
    ]);

    return NextResponse.json({
      status: 'Prisma Client connected successfully',
      metrics: {
        totalListings: listingsCount,
        activeUsers: usersCount,
        puneLocalities: localitiesCount,
      },
      sample: sampleListings,
    });
  } catch (error: any) {
    console.error('Prisma test route error:', error);
    return NextResponse.json(
      {
        status: 'Prisma error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
