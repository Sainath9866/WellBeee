import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/app/lib/mongodb';

interface UpdateProfileBody {
    age: number;
    gender: string;
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.email) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();
        const { age, gender } = await request.json() as UpdateProfileBody;

        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { $set: { age, gender } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: 'Profile updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json(
            { 
                message: 'Profile update failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
