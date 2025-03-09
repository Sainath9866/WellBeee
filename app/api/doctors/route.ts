import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Doctor from '@/models/doctor';
import dbConnect from '@/lib/mongodb';

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Fetch all doctors with their ratings
    const doctors = await Doctor.find({ isAvailable: true })
      .select('name email specialization qualification experience workingHours availableDays ratings averageRating about profileImage')
      .sort({ averageRating: -1 });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
} 