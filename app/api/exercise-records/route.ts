import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

// Define a schema for exercise records if it doesn't exist
let ExerciseRecord;
try {
  ExerciseRecord = mongoose.model('ExerciseRecord');
} catch {
  const ExerciseRecordSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    exerciseType: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    caloriesBurned: {
      type: Number,
      required: true
    },
    notes: {
      type: String
    }
  }, { timestamps: true });

  ExerciseRecord = mongoose.model('ExerciseRecord', ExerciseRecordSchema);
}

// GET all exercise records for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const exerciseType = url.searchParams.get('exerciseType');

    // Build query
    const query: any = { userId: user._id };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    if (exerciseType) {
      query.exerciseType = exerciseType;
    }

    const records = await ExerciseRecord.find(query).sort({ date: -1 });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error in GET /api/exercise-records:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// CREATE a new exercise record
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.exerciseType || !data.duration || !data.caloriesBurned || !data.date) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new record
    const newRecord = new ExerciseRecord({
      userId: user._id,
      date: new Date(data.date),
      exerciseType: data.exerciseType,
      duration: data.duration,
      caloriesBurned: data.caloriesBurned,
      notes: data.notes || ''
    });

    await newRecord.save();

    return NextResponse.json(
      { message: 'Exercise record created successfully', record: newRecord },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/exercise-records:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 