import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Post from '@/models/Post';
import User from '@/models/User';
import dbConnect from '../../../lib/mongodb';
import { authOptions } from '@/lib/auth'; // Import your auth options

export async function POST(req: Request) {
    try {
        // Pass the auth options to getServerSession
        const session = await getServerSession(authOptions);
        
        console.log("Session in API:", session); // Add logging

        if (!session || !session.user?.email) {
            return NextResponse.json(
                { message: 'Unauthorized: Please sign in' },
                { status: 401 }
            );
        }
        
        await dbConnect();
        const user = await User.findOne({ email: session.user.email });
        
        console.log("Found user:", user ? user._id : null); // Add logging
       
        if (!user) {
            return NextResponse.json(
                { message: 'User not found in database' },
                { status: 404 }
            );
        }
        
        const { content } = await req.json();
        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { message: 'Post content cannot be empty' },
                { status: 400 }
            );
        }
        
        const post = new Post({
            userId: user._id,
            content: content.trim(),
        });
        
        await post.save();
        const populatedPost = await Post.findById(post._id)
            .populate('userId', 'name email image')
            .populate('likes', 'name email');
            
        return NextResponse.json(
            { message: 'Post created successfully', post: populatedPost },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error in POST /api/user/posts:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}