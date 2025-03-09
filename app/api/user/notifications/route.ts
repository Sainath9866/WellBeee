import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import Notification from '@/models/Notification';
import User from '@/models/User';
import dbConnect from '@/app/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Import Post model or create a fallback if it doesn't exist
let Post;
try {
  Post = require("@/models/Post").default;
} catch (error) {
  // Create a minimal Post model if it doesn't exist
  const mongoose = require("mongoose");
  const PostSchema = new mongoose.Schema({
    content: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  });
  
  Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
}

export async function GET() {
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

    const notifications = await Notification.find({ userId: user._id })
      .populate('fromUser', 'name image')
      .populate('postId', 'content')
      .sort({ createdAt: -1 });

    return NextResponse.json(notifications);

  } catch (error: any) {
    console.error('Error in GET /api/user/notifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notifications', error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if request has a body
    let notificationId;
    try {
      const body = await req.json();
      notificationId = body.notificationId;
    } catch (parseError) {
      // If no body or invalid JSON, mark all as read
      console.log("No valid JSON body, marking all notifications as read");
      await Notification.updateMany(
        { userId: user._id, read: false },
        { read: true }
      );
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    // If notificationId is provided, mark specific notification as read
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      return NextResponse.json({ message: "Notification marked as read" });
    } 
    // Otherwise mark all as read
    else {
      await Notification.updateMany(
        { userId: user._id, read: false },
        { read: true }
      );
      return NextResponse.json({ message: "All notifications marked as read" });
    }
  } catch (error: any) {
    console.error("Error in PATCH /api/user/notifications:", error);
    return NextResponse.json(
      { message: "Failed to update notification", error: error.message },
      { status: 500 }
    );
  }
} 