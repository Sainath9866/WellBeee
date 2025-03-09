import mongoose from "mongoose";

const JournalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    thoughts: {
      type: String,
      required: true,
    },
    tags: [{
      type: String,
      trim: true
    }],
    mood: {
      type: String,
      enum: ['Happy', 'Sad', 'Anxious', 'Excited', 'Neutral', 'Stressed', 'Calm'],
      default: 'Neutral'
    }
  },
  { 
    timestamps: true 
  }
);

// Add index for faster querying
JournalSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Journal || mongoose.model("Journal", JournalSchema);
