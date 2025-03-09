import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import mongoose from 'mongoose';
import Post from '@/models/Post';
import User from '@/models/User';
import Notification from '@/models/Notification';
import dbConnect from '@/app/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
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
    const params = await context.params;
    const { postId } = params;

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { message: 'Invalid post ID format' },
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

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { message: 'Reply content cannot be empty' },
        { status: 400 }
      );
    }

    const parentPost = await Post.findById(postId);
    if (!parentPost) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    // Create a new Post document for the reply
    const reply = new Post({
      content: content.trim(),
      userId: user._id,
      parentPost: postId, // Set the parent post reference
      likes: [],
      replies: []
    });

    // Save the reply
    await reply.save();

    // Add the reply reference to the parent post's replies array
    parentPost.replies.push(reply._id);
    await parentPost.save();

    // Create notification for the parent post's author
    if (parentPost.userId.toString() !== user._id.toString()) {
      await Notification.create({
        userId: parentPost.userId,
        type: 'reply',
        postId: parentPost._id,
        fromUser: user._id,
      });
    }

    // Fetch updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('userId', 'name email image')
      .populate('likes', 'name email')
      .populate({
        path: 'replies',
        populate: {
          path: 'userId',
          select: 'name email image'
        }
      });

    return NextResponse.json({
      message: 'Reply added successfully',
      thread: updatedPost
    });

  } catch (error) {
    console.error('Error in POST /api/user/post/[postId]/reply:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}