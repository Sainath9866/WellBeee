"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import axios from "axios";
import { CalendarIcon, HistoryIcon } from "lucide-react";

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedFactor, setSelectedFactor] = useState("");
  const [otherFactor, setOtherFactor] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState({ type: "", message: "" });
  const router = useRouter();

  const moodOptions = [
    { emoji: "😊", text: "Great", color: "bg-green-500" },
    { emoji: "🙂", text: "Good", color: "bg-blue-500" },
    { emoji: "😐", text: "Okay", color: "bg-yellow-500" },
    { emoji: "😕", text: "Bad", color: "bg-orange-500" },
    { emoji: "😢", text: "Terrible", color: "bg-red-500" }
  ];

  const factorOptions = [
    { icon: "😴", text: "Sleep" },
    { icon: "🏃", text: "Exercise" },
    { icon: "🥗", text: "Nutrition" },
    { icon: "🧠", text: "Stress" },
    { icon: "👥", text: "Social" },
    { icon: "✨", text: "Other" }
  ];

  const handleMoodClick = (mood: { emoji: string; text: string; color: string }) => {
    setSelectedMood(`${mood.emoji} ${mood.text}`);
  };

  const handleFactorClick = (factor: { icon: string; text: string }) => {
    setSelectedFactor(factor.text);
  };

  const handleSubmit = async () => {
    if (!selectedMood) {
      setSubmissionStatus({ 
        type: "error", 
        message: "Please select how you're feeling today" 
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus({ type: "", message: "" });

    try {
      const session = await getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      const response = await axios.post("/api/user/mood", {
        feeling: selectedMood,
        factor: selectedFactor === "Other" ? otherFactor : selectedFactor,
        notes,
      });
      
      if (response.status === 200) {
        setSubmissionStatus({ 
          type: "success", 
          message: "Mood recorded successfully! Keep taking care of yourself." 
        });
        
        // Clear form after successful submission
        setSelectedMood("");
        setSelectedFactor("");
        setOtherFactor("");
        setNotes("");
      }
    } catch (error) {
      console.error("Error recording mood:", error);
      setSubmissionStatus({ 
        type: "error", 
        message: "Failed to record mood. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

  return (
    <section className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-8 md:py-12">
          {/* Header with date */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center text-gray-300">
              <CalendarIcon className="w-5 h-5 mr-2" />
              <span>{getCurrentDate()}</span>
            </div>
            <button 
              className="cursor-pointer flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-full text-white text-sm font-medium" 
              onClick={() => router.push("/mood-history")}
            >
              <HistoryIcon className="w-4 h-4 mr-2" />
              View History and Analytics
            </button>
          </div>
          
          {/* Title */}
          <div className="pb-8 text-center">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-5xl font-bold text-transparent md:text-6xl mb-4"
              data-aos="fade-up"
            >
              Mood Tracker
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Track your emotional wellbeing and identify patterns to better understand yourself
            </p>
          </div>
          
          {/* Mood tracking card */}
          <div className="mx-auto max-w-3xl p-8 bg-gray-800 rounded-2xl shadow-lg border border-gray-700">
            {/* Status message */}
            {submissionStatus.message && (
              <div className={`mb-6 p-4 rounded-lg text-center ${
                submissionStatus.type === "error" ? "bg-red-900/30 text-red-200 border border-red-700" : 
                "bg-green-900/30 text-green-200 border border-green-700"
              }`}>
                {submissionStatus.message}
              </div>
            )}
            
            {/* Mood selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">How are you feeling today?</span>
                {selectedMood && <span className="text-3xl">{selectedMood.split(" ")[0]}</span>}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {moodOptions.map((mood) => (
                  <button
                    key={mood.text}
                    className={`cursor-pointer p-4 rounded-xl flex flex-col items-center justify-center transition-all transform hover:scale-105 ${
                      selectedMood === `${mood.emoji} ${mood.text}` 
                        ? `${mood.color} ring-4 ring-white/20` 
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => handleMoodClick(mood)}
                  >
                    <span className="text-4xl mb-2">{mood.emoji}</span>
                    <span className="text-white font-medium">{mood.text}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Factors selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">What factors are affecting your mood?</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {factorOptions.map((factor) => (
                  <button
                    key={factor.text}
                    className={`cursor-pointer p-4 rounded-xl flex items-center justify-center transition-all transform hover:scale-105 ${
                      selectedFactor === factor.text
                        ? "bg-indigo-600 ring-4 ring-indigo-300/20"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => handleFactorClick(factor)}
                  >
                    <span className="text-2xl mr-2">{factor.icon}</span>
                    <span className="text-white font-medium">{factor.text}</span>
                  </button>
                ))}
              </div>
              
              {selectedFactor === "Other" && (
                <input
                  type="text"
                  className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="What else is affecting your mood?"
                  value={otherFactor}
                  onChange={(e) => setOtherFactor(e.target.value)}
                />
              )}
            </div>
            
            {/* Notes */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Entry</h2>
              <textarea
                placeholder="Write about your day, challenges, wins, or anything else you'd like to remember..."
                className="w-full p-4 bg-gray-700 border border-gray-600 text-white rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            
            {/* Submit button */}
            <div className="flex justify-center">
              <button 
                className={`cursor-pointer px-8 py-3 rounded-full text-lg font-medium transition-all transform hover:scale-105 ${
                  isSubmitting 
                    ? "bg-gray-600 text-gray-300 cursor-not-allowed" 
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                }`} 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}