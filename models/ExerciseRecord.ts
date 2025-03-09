import mongoose from "mongoose";

const ExerciseRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    activity: {
      type: String,
      required: true,
      enum: [
        // Cardio
        "Running", "Walking", "Cycling", "Swimming", "Jump Rope", "Hiking",
        // Strength Training
        "Push-ups", "Pull-ups", "Squats", "Lunges", "Deadlifts", "Bench Press",
        "Shoulder Press", "Bicep Curls", "Tricep Extensions", "Planks",
        // Flexibility
        "Yoga", "Stretching", "Pilates",
        // Sports
        "Basketball", "Tennis", "Soccer", "Volleyball",
        // Other
        "HIIT", "CrossFit", "Dancing", "Other"
      ],
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    distance: {
      type: Number, // in kilometers
      default: 0,
    },
    calories: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    startTime: {
      type: String, // Store as string in format "HH:MM"
      required: true,
    },
    notes: {
      type: String,
      maxlength: 200,
    },
    markAsDone: {
      type: Boolean,
      default: false,
    },
    sets: {
      type: Number,
      default: 0,
    },
    reps: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number, // in kg
      default: 0,
    },
    intensity: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    }
  },
  { timestamps: true }
);

// Add index for faster querying by date and userId
ExerciseRecordSchema.index({ userId: 1, date: -1 });

export default mongoose.models.ExerciseRecord || mongoose.model("ExerciseRecord", ExerciseRecordSchema);