"use client";
import { useState } from "react";

export default function MoodTracker() {
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedFactor, setSelectedFactor] = useState("");
  const [otherFactor, setOtherFactor] = useState("");

  const handleMoodClick = (mood: any) => {
    setSelectedMood(mood);
  };

  const handleFactorClick = (factor : any ) => {
    setSelectedFactor(factor);
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero content */}
        <div className="py-3 md:py-7">
          {/* Section header */}
          <div className="pb-3 text-center md:pb-7">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-2 font-nacelle text-2xl font-semibold text-transparent md:text-3xl"
              data-aos="fade-up"
            >
              Mood Tracker
            </h1>
          </div>
          {/* New mood tracking box */}
          <div className="mx-auto max-w-3xl p-6 bg-gray-800 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-semibold text-white mb-4">How are you feeling today?</h2>
            <div className="flex justify-center gap-2 mb-4">
              {["😊 Great", "🙂 Good", "😐 Okay", "😕 Bad", "😢 Terrible"].map((mood) => (
                <button
                  key={mood}
                  className={`btn-sm bg-gray-700 text-white cursor-pointer ${selectedMood === mood ? "bg-blue-500" : ""}`}
                  onClick={() => handleMoodClick(mood)}
                >
                  {mood}
                </button>
              ))}
            </div>
            <h2 className="text-2xl font-semibold text-white mb-4">What factors are affecting your mood?</h2>
            <div className="flex justify-center gap-2 mb-4">
              {["Sleep", "Exercise", "Nutrition", "Stress", "Social"].map((factor) => (
                <button
                  key={factor}
                  className={`btn-sm bg-gray-700 text-white cursor-pointer ${selectedFactor === factor ? "bg-blue-500" : ""}`}
                  onClick={() => handleFactorClick(factor)}
                >
                  {factor}
                </button>
              ))}
              <button
                className={`btn-sm bg-gray-700 text-white cursor-pointer ${selectedFactor === "Other" ? "bg-blue-500" : ""}`}
                onClick={() => handleFactorClick("Other")}
              >
                Other
              </button>
            </div>
            {selectedFactor === "Other" && (
              <input
                type="text"
                className="w-full p-2 mb-4 bg-gray-700 text-white rounded-lg"
                placeholder="Please specify"
                value={otherFactor}
                onChange={(e) => setOtherFactor(e.target.value)}
              />
            )}
            <textarea placeholder="Add notes about your day . . ."className="w-full p-2 mb-4 bg-gray-700 text-white rounded-lg" rows="4"></textarea>
            <button className="btn bg-indigo-600 text-white">Save Entry</button>
          </div>
        </div>
      </div>
    </section>
  );
}