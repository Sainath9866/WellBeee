interface ExerciseParams {
  activity: string;
  duration: number;
  distance?: number;
  weight?: number;
  sets?: number;
  reps?: number;
  intensity: 'Low' | 'Medium' | 'High';
}

const DEFAULT_WEIGHT = 70; // Default weight in kg

// MET values for different activities
const MET_VALUES: { [key: string]: { Low: number; Medium: number; High: number } } = {
  // Cardio
  Running: { Low: 6, Medium: 8, High: 12 },
  Walking: { Low: 2.5, Medium: 3.5, High: 4.5 },
  Cycling: { Low: 4, Medium: 6, High: 10 },
  Swimming: { Low: 5, Medium: 7, High: 10 },
  'Jump Rope': { Low: 8, Medium: 10, High: 12 },
  Hiking: { Low: 3.5, Medium: 5, High: 7 },

  // Strength Training
  'Push-ups': { Low: 3.8, Medium: 6, High: 8 },
  'Pull-ups': { Low: 3.8, Medium: 6, High: 8 },
  Squats: { Low: 3.8, Medium: 6, High: 8 },
  Lunges: { Low: 3.8, Medium: 6, High: 8 },
  Deadlifts: { Low: 4, Medium: 6.5, High: 9 },
  'Bench Press': { Low: 4, Medium: 6.5, High: 9 },
  'Shoulder Press': { Low: 3.8, Medium: 6, High: 8 },
  'Bicep Curls': { Low: 3.5, Medium: 5.5, High: 7.5 },
  'Tricep Extensions': { Low: 3.5, Medium: 5.5, High: 7.5 },
  Planks: { Low: 3, Medium: 4.5, High: 6 },

  // Flexibility
  Yoga: { Low: 2.5, Medium: 3.5, High: 4.5 },
  Stretching: { Low: 2, Medium: 2.5, High: 3 },
  Pilates: { Low: 3, Medium: 4.5, High: 6 },

  // Sports
  Basketball: { Low: 4.5, Medium: 6.5, High: 8.5 },
  Tennis: { Low: 4, Medium: 6, High: 8 },
  Soccer: { Low: 5, Medium: 7, High: 10 },
  Volleyball: { Low: 3.5, Medium: 5, High: 7 },

  // Other
  HIIT: { Low: 6, Medium: 8.5, High: 12 },
  CrossFit: { Low: 6, Medium: 8.5, High: 12 },
  Dancing: { Low: 3.5, Medium: 5, High: 7 },
  Other: { Low: 4, Medium: 6, High: 8 }
};

export function calculateCaloriesBurned(params: ExerciseParams): number {
  const { activity, duration, distance, weight = DEFAULT_WEIGHT, sets, reps, intensity } = params;
  
  // Get MET value for the activity and intensity
  const met = MET_VALUES[activity]?.[intensity] || MET_VALUES.Other[intensity];
  
  // Base calorie calculation using MET formula
  let calories = (met * weight * duration / 60) * 3.5 * 5 / 1000;
  
  // For strength training exercises, add additional calories based on sets and reps
  if (sets && reps && ['Push-ups', 'Pull-ups', 'Squats', 'Lunges', 'Deadlifts', 'Bench Press', 'Shoulder Press', 'Bicep Curls', 'Tricep Extensions'].includes(activity)) {
    const totalReps = sets * reps;
    const repCalories = (totalReps * 0.29) * (weight / DEFAULT_WEIGHT);
    calories = Math.max(calories, repCalories); // Use the higher value
  }
  
  // For distance-based activities, also calculate using distance formula and use the higher value
  if (distance && ['Running', 'Walking', 'Cycling', 'Hiking'].includes(activity)) {
    const distanceCalories = distance * weight * 1.036;
    calories = Math.max(calories, distanceCalories);
  }
  
  // Round to nearest whole number
  return Math.round(calories);
}

// Example usage:
// const calories = calculateCaloriesBurned({
//   activity: 'Running',
//   duration: 30,
//   distance: 5,
//   intensity: 'Medium',
//   weight: 70
// }); 