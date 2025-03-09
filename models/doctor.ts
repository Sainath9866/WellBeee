import mongoose from "mongoose";

// Create a fresh schema without any userId field
const DoctorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    name: {
      type: String,
      required: [true, "Name is required"]
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"]
    },
    qualification: {
      type: String,
      required: [true, "Qualification is required"]
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"]
    },
    workingHours: {
      start: {
        type: String,
        required: [true, "Start time is required"]
      },
      end: {
        type: String,
        required: [true, "End time is required"]
      }
    },
    availableDays: {
      type: [String],
      validate: {
        validator: function(v: string[]) {
          return v && v.length > 0;
        },
        message: "At least one available day is required"
      }
    },
    maxAppointmentsPerDay: {
      type: Number,
      default: 10
    },
    about: String,
    profileImage: String,
    ratings: {
      type: [{
        rating: Number,
        review: String,
        date: {
          type: Date,
          default: Date.now
        }
      }],
      default: []
    },
    averageRating: {
      type: Number,
      default: 0
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Delete any existing model to ensure clean slate
if (mongoose.models.Doctor) {
  delete mongoose.models.Doctor;
}

// Create a new model
const Doctor = mongoose.model("Doctor", DoctorSchema);

export default Doctor; 