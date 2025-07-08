import { auth } from '@/auth/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createLocationSchema = z.object({
  type: z.enum(['HOME', 'OFFICE', 'OTHER']),
  label: z.string().optional(),
  address: z.string(),
  formattedAddress: z.string(),
  placeId: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locations = await db.location.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createLocationSchema.parse(body);

    // If this location is set as default, unset other defaults
    if (validatedData.isDefault) {
      await db.location.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const location = await db.location.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        label: validatedData.label,
        address: validatedData.address,
        formattedAddress: validatedData.formattedAddress,
        placeId: validatedData.placeId,
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        city: validatedData.city,
        state: validatedData.state,
        country: validatedData.country,
        postalCode: validatedData.postalCode,
        isDefault: validatedData.isDefault || false,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
} 