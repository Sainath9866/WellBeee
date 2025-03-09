"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface MoodEntry {
  _id?: string;
  date: string;
  feeling: string;
  factor: string;
  notes: string;
}

interface ChartData {
  date: string;
  value: number;
  feeling: string;
}

interface AnalyticsData {
  name: string;
  value: number;
}

export default function MoodHistory() {
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
  const [visibleMoods, setVisibleMoods] = useState<MoodEntry[]>([]);
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(0);
  const router = useRouter();

  // Mood colors mapping - Enhanced visibility for "Great" mood
  const MOOD_COLORS: { [key: string]: string } = {
    "😢 Terrible": "#ef4444",
    "😕 Bad": "#f97316",
    "😐 Okay": "#fbbf24",
    "🙂 Good": "#60a5fa",
    "😊 Great": "#22c55e", // Using a more vibrant green for better visibility  
  };

  // Mood level mapping for consistent chart values
  const MOOD_LEVELS: { [key: string]: number } = {
    "😢 Terrible": 1,
    "😕 Bad": 2,
    "😐 Okay": 3,
    "🙂 Good": 4,
    "😊 Great": 5, 
  };

  const FACTOR_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  useEffect(() => {
    const fetchMoodHistory = async () => {
      const session = await getSession();
      if (!session) {
        router.push("/auth/signin");
        return;
      }

      try {
        const response = await axios.get("/api/user/mood");
        // Sort by date (newest first)
        const sortedData = response.data.sort((a: MoodEntry, b: MoodEntry) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMoodHistory(sortedData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching mood history:", error);
        setLoading(false);
      }
    };

    fetchMoodHistory();
  }, [router]);

  // Animation effect to show moods one by one - only for current week's data
  useEffect(() => {
    if (!loading && moodHistory.length > 0) {
      const currentWeekData = getCurrentWeekData();
      if (currentMoodIndex < currentWeekData.length) {
        const timer = setTimeout(() => {
          setVisibleMoods(prev => [...prev, currentWeekData[currentMoodIndex]]);
          setCurrentMoodIndex(prev => prev + 1);
        }, 500); // Adjust timing as needed
        
        return () => clearTimeout(timer);
      }
    }
  }, [currentMoodIndex, moodHistory, loading, currentWeekStart]);

  // Get data for the current week view
  const getCurrentWeekData = (): MoodEntry[] => {
    const endIndex = currentWeekStart + 7;
    return moodHistory.slice(currentWeekStart, endIndex);
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    if (currentWeekStart + 7 < moodHistory.length) {
      setCurrentWeekStart(prev => prev + 7);
      setVisibleMoods([]);
      setCurrentMoodIndex(0);
    }
  };

  // Navigate to next week
  const goToNextWeek = () => {
    if (currentWeekStart - 7 >= 0) {
      setCurrentWeekStart(prev => prev - 7);
      setVisibleMoods([]);
      setCurrentMoodIndex(0);
    }
  };

  // Prepare data for analytics - restricted to current week view
  const getFactorAnalytics = (): AnalyticsData[] => {
    const currentWeekData = getCurrentWeekData();
    const factorCount = currentWeekData.reduce((acc: { [key: string]: number }, item: MoodEntry) => {
      acc[item.factor] = (acc[item.factor] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(factorCount).map(key => ({
      name: key,
      value: factorCount[key]
    }));
  };

  const getMoodAnalytics = (): AnalyticsData[] => {
    const currentWeekData = getCurrentWeekData();
    const moodCount = currentWeekData.reduce((acc: { [key: string]: number }, item: MoodEntry) => {
      acc[item.feeling] = (acc[item.feeling] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(moodCount).map(key => ({
      name: key,
      value: moodCount[key]
    }));
  };

  // Format chart data - for current week only
  const getChartData = (): ChartData[] => {
    return getCurrentWeekData().map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      value: MOOD_LEVELS[item.feeling] || 3, // Default to "Okay" if not found
      feeling: item.feeling
    })).reverse(); // Oldest to newest for timeline
  };

  // Format week date range for display
  const getWeekDateRange = (): string => {
    if (moodHistory.length === 0) return "No data";
    
    const currentWeekData = getCurrentWeekData();
    if (currentWeekData.length === 0) return "No data for this week";
    
    const lastEntry = currentWeekData[0];
    const firstEntry = currentWeekData[currentWeekData.length - 1] || lastEntry;
    
    const firstDate = new Date(firstEntry.date).toLocaleDateString();
    const lastDate = new Date(lastEntry.date).toLocaleDateString();
    
    return `${firstDate} - ${lastDate}`;
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload }: { active?: boolean, payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-2 rounded shadow-md">
          <p className="text-white">{`Date: ${payload[0].payload.date}`}</p>
          <p className="text-white">{`Mood: ${payload[0].payload.feeling}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-3 md:py-7">
          <div className="pb-3 text-center md:pb-8">
            <h1
              className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text pb-5 font-nacelle text-4xl font-semibold text-transparent md:text-3xl"
              data-aos="fade-up"
            >
              Your Mood Journey
            </h1>
          </div>

          {loading ? (
            <div className="mx-auto max-w-3xl p-6 bg-gray-900 rounded-lg shadow-md text-center">
              <div className="flex justify-center items-center">
                <div className="h-8 w-8 rounded-full border-4 border-t-indigo-500 border-gray-700 animate-spin"></div>
                <p className="ml-2 text-white">Loading your mood data...</p>
              </div>
            </div>
          ) : moodHistory.length === 0 ? (
            <div className="mx-auto max-w-3xl p-6 bg-gray-900 rounded-lg shadow-md text-center">
              <p className="text-white text-lg mb-4">No mood entries found.</p>
              <button 
                className="cursor-pointer btn bg-indigo-600 text-white"
                onClick={() => router.push("/")}
              >
                Record Your First Mood
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Week Navigation */}
              <div className="mx-auto max-w-3xl flex justify-between items-center px-4">
                <button 
                  className={`cursor-pointer px-4 py-2 rounded bg-indigo-600 text-white ${currentWeekStart + 7 >= moodHistory.length ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={goToPreviousWeek}
                  disabled={currentWeekStart + 7 >= moodHistory.length}
                >
                  Previous Week
                </button>
                <span className="text-white font-medium">{getWeekDateRange()}</span>
                <button 
                  className={`cursor-pointer px-4 py-2 rounded bg-indigo-600 text-white ${currentWeekStart === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={goToNextWeek}
                  disabled={currentWeekStart === 0}
                >
                  Next Week
                </button>
              </div>

              {/* Mood Timeline Chart */}
              <div className="mx-auto max-w-3xl p-6 bg-gray-900 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-white mb-4">Mood Timeline</h2>
                <div className="h-64 text-white">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getChartData()}
                      margin={{ top: 6, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="date" stroke="#aaa" />
                      <YAxis domain={[0, 5]} stroke="#aaa" ticks={[0, 1, 2, 3, 4, 5]} tickFormatter={(value) => {
                        const labels = {0: "", 1: "😢", 2: "😕", 3: "😐", 4: "🙂", 5: "😊"};
                        return labels[value as keyof typeof labels] || '';
                      }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.feeling] || "#60a5fa"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Analytics Section - Weekly data only */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Factors Breakdown */}
                <div className="p-6 bg-gray-900 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-white mb-4">Weekly Factors Affecting Your Mood</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getFactorAnalytics()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getFactorAnalytics().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={FACTOR_COLORS[index % FACTOR_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Mood Distribution */}
                <div className="p-6 bg-gray-900 rounded-lg shadow-md">
                  <h2 className="text-xl font-semibold text-white mb-4">Weekly Mood Distribution</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getMoodAnalytics()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getMoodAnalytics().map((entry) => (
                            <Cell key={entry.name} fill={MOOD_COLORS[entry.name] || "#60a5fa"} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Mood Entries Log - Only show current week's entries */}
              <div className="mx-auto max-w-3xl p-6 bg-gray-900 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-white mb-4">Your Weekly Mood Entries</h2>
                <div className="space-y-4">
                  {visibleMoods.map((mood, index) => (
                    <div 
                      key={mood._id || index} 
                      className="p-4 bg-gray-800 rounded-lg border-l-4 transition-all duration-300"
                      style={{ borderLeftColor: MOOD_COLORS[mood.feeling] || "#60a5fa" }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">{new Date(mood.date).toLocaleDateString()}</span>
                        <span 
                          className="px-3 py-1 rounded-full text-white text-sm"
                          style={{ backgroundColor: MOOD_COLORS[mood.feeling] || "#60a5fa" }}
                        >
                          {mood.feeling}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm bg-gray-700 px-2 py-1 rounded text-white">{mood.factor}</span>
                        <p className="text-gray-300 mt-2">{mood.notes}</p>
                      </div>
                    </div>
                  ))}
                  {currentMoodIndex < getCurrentWeekData().length && (
                    <div className="text-center py-2">
                      <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                      <p className="text-sm text-gray-400 mt-2">Loading more entries...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}