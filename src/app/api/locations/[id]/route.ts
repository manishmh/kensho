import { auth } from '@/auth/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateLocationSchema = z.object({
  type: z.enum(['HOME', 'OFFICE', 'OTHER']).optional(),
  label: z.string().optional(),
  address: z.string().optional(),
  formattedAddress: z.string().optional(),
  placeId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const body = await request.json();
    const validatedData = updateLocationSchema.parse(body);

    // Check if location belongs to user
    const existingLocation = await db.location.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // If this location is set as default, unset other defaults
    if (validatedData.isDefault) {
      await db.location.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          NOT: {
            id: params.id,
          },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedLocation = await db.location.update({
      where: {
        id: params.id,
      },
      data: validatedData,
    });

    return NextResponse.json(updatedLocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;

    // Check if location belongs to user
    const existingLocation = await db.location.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    await db.location.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
} 