import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/app/lib/mongodb';
import User from '@/models/User';
import mongoose, { Model } from 'mongoose';

// Define interface for exercise record
interface IExerciseRecord {
  userId: mongoose.Types.ObjectId;
  date: Date;
  exerciseType: string;
  duration: number;
  caloriesBurned: number;
  notes?: string;
}

// Define a schema for exercise records if it doesn't exist
let ExerciseRecord: Model<IExerciseRecord>;
try {
  ExerciseRecord = mongoose.model<IExerciseRecord>('ExerciseRecord');
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

  ExerciseRecord = mongoose.model<IExerciseRecord>('ExerciseRecord', ExerciseRecordSchema);
}

// GET a specific exercise record
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const record = await ExerciseRecord.findOne({
      _id: id,
      userId: user._id
    });

    if (!record) {
      return NextResponse.json(
        { message: 'Exercise record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error in GET /api/exercise-records/[id]:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// UPDATE a specific exercise record
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const data = await request.json();
    
    // Validate required fields
    if (!data.exerciseType || !data.duration || !data.caloriesBurned) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedRecord = await ExerciseRecord.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: data },
      { new: true }
    );

    if (!updatedRecord) {
      return NextResponse.json(
        { message: 'Exercise record not found or not authorized to update' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error in PUT /api/exercise-records/[id]:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a specific exercise record
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const deletedRecord = await ExerciseRecord.findOneAndDelete({
      _id: id,
      userId: user._id
    });

    if (!deletedRecord) {
      return NextResponse.json(
        { message: 'Exercise record not found or not authorized to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Exercise record deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/exercise-records/[id]:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
