import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Mood from '@/models/Mood';
import dbConnect from '../../../lib/mongodb.js';
import mongoose from 'mongoose';

export async function POST(req: Request) {
    let session;
    try {
        // The getServerSession function likely needs options - check next-auth docs
        session = await getServerSession();
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ message: 'Internal server error', error }, { status: 500 });
    }
    
    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    try {
        // Connect to the database using Mongoose
        await dbConnect();
    } catch (error) {
        console.error('Error connecting to database:', error);
        return NextResponse.json({ message: 'Database connection error', error }, { status: 500 });
    }
    
    // Use Mongoose models directly
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
    
    // Fixed the negation in the query
    const user = await User.findOne({ email: session.user?.email });
    
    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    const { feeling, factor, notes } = await req.json();
    
    try {
        const mood = new Mood({
            user_id: user._id, // No need to convert to ObjectId, mongoose handles this
            feeling,
            factor,
            notes,
        });
        
        await mood.save();
        return NextResponse.json({ message: 'Mood recorded successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error recording mood:', error);
        return NextResponse.json({ message: 'Mood recording failed', error }, { status: 500 });
    }
}

export async function GET(req: Request) {
    let session;
    try {
        session = await getServerSession();
    } catch (error) {
        console.error('Error fetching session:', error);
        return NextResponse.json({ message: 'Internal server error', error }, { status: 500 });
    }

    if (!session) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();
    } catch (error) {
        console.error('Error connecting to database:', error);
        return NextResponse.json({ message: 'Database connection error', error }, { status: 500 });
    }

    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}));
    const user = await User.findOne({ email: session.user?.email });

    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    try {
        const moods = await Mood.find({ user_id: user._id }).sort({ date: -1 });
        return NextResponse.json(moods, { status: 200 });
    } catch (error) {
        console.error('Error fetching mood history:', error);
        return NextResponse.json({ message: 'Failed to fetch mood history', error }, { status: 500 });
    }
}