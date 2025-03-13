import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Post from '@/models/Post';
import dbConnect from '@/app/lib/mongodb';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(
  request: Request,
  props: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();
    const { postId } = await props.params;

    // Validate postId format
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json(
        { message: 'Invalid post ID format' },
        { status: 400 }
      );
    }

    const parentPost = await Post.findById(postId)
      .populate('userId', 'name email image')
      .populate('likes', 'name email')
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
      });

    if (!parentPost) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Thread retrieved successfully',
      thread: parentPost
    });

  } catch (error) {
    console.error('Error in GET /api/user/post/thread/[postId]:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
