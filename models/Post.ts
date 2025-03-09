import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User model
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 500, // Limit content length
    },
    parentPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post", // For replies
      default: null,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replies: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post", // References reply posts
      },
    ],
    date: {
        type: Date,
        default: Date.now, // Default to current date and time
    },
    comments: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

// Add indexes for faster querying
PostSchema.index({ userId: 1, createdAt: -1 });
PostSchema.index({ 'comments.userId': 1 });

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
