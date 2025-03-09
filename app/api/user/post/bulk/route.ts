import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Post from '@/models/Post';
import User from '@/models/User';  // Import User model
import dbConnect from '../../../../lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req: Request) {
    try {
        const session = await getServerSession();
        
        if (!session) {
            return NextResponse.json([], { status: 401 });
        }

        await dbConnect();

        // Ensure User model is initialized
        await User.findOne();  // This ensures the model is registered

        // Get all posts, sorted by date (newest first)
        const posts = await Post.find({
            parentPost: null  // Only get main posts, not replies
        })
        .sort({ createdAt: -1 })
        .populate('userId', 'name email image')  // Get user details
        .populate('likes', 'name email')  // Get likes details
        .populate({
            path: 'replies',
            populate: [
                { 
                    path: 'userId',
                    select: 'name email image'
                },
                {
                    path: 'likes',
                    select: 'name email'
                }
            ]
        });  // Get replies with their user details and likes

        // Ensure we return an array even if no posts are found
        return NextResponse.json(posts || [], { status: 200 });
    } catch (error) {
        console.error('Error in GET /api/user/post/bulk:', error);
        // Return empty array instead of error object
        return NextResponse.json([], { status: 500 });
    }
}
