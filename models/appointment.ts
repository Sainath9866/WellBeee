import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      start: {
        type: String,
        required: true,
      },
      end: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'in-progress'],
      default: 'scheduled'
    },
    type: {
      type: String,
      enum: ['in-person', 'video', 'phone'],
      default: 'video'
    },
    symptoms: String,
    diagnosis: String,
    prescription: String,
    notes: String,
    meetingLink: String,
    followUpDate: Date,
    rating: {
      score: Number,
      review: String,
      date: Date
    }
  },
  { timestamps: true }
);

// Add indexes for faster querying
AppointmentSchema.index({ doctorId: 1, date: 1 });
AppointmentSchema.index({ patientId: 1, date: 1 });
AppointmentSchema.index({ status: 1 });

// Delete any existing model to ensure clean slate
if (mongoose.models.Appointment) {
  delete mongoose.models.Appointment;
}

// Create a new model
const Appointment = mongoose.model("Appointment", AppointmentSchema);

export default Appointment; 