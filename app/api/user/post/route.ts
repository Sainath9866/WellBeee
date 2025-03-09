import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Post from '@/models/Post';
import User from '@/models/User';
import dbConnect from '../../../lib/mongodb';

export async function POST(req: Request) {
    try {
        const session = await getServerSession();
        
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // Find the user
        const user = await User.findOne({ email: session.user?.email });
        
        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const { content, parentPost } = await req.json();

        // Create new post
        const post = new Post({
            userId: user._id,
            content,
            parentPost: parentPost || null,
        });

        await post.save();

        // Populate user details before returning
        const populatedPost = await Post.findById(post._id)
            .populate('userId', 'name email image')
            .populate('likes', 'name email');

        return NextResponse.json(populatedPost, { status: 200 });
    } catch (error) {
        console.error('Error in POST /api/user/post:', error);
        return NextResponse.json(
            { message: 'Failed to create post', error }, 
            { status: 500 }
        );
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

    const user = await User.findOne({ email: session.user?.email });

    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    try {
        const posts = await Post.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')  // Populate user details
            .populate({
                path: 'parentPost',
                select: 'content userId',
                populate: { path: 'userId', select: 'name email' }
            })  // Populate parent post if it exists
            .populate({
                path: 'replies',
                select: 'content userId',
                populate: { path: 'userId', select: 'name email' }
            });  // Populate replies

        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ message: 'Failed to fetch posts', error }, { status: 500 });
    }
}
