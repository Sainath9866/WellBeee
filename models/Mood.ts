import mongoose, { Schema, model, models } from 'mongoose';

const moodSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  feeling: {
    type: String,
    required: true,
  },
  factor: String,
  notes: String,
  date: {
    type: Date,
    default: Date.now, // Default to current date and time
  },
}, { timestamps: true });

const Mood = models.Mood || model('Mood', moodSchema);

export default Mood;
