"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { calculateCaloriesBurned } from '@/utils/calorieCalculator';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types
interface ExerciseRecord {
  _id: string;
  activity: string;
  duration: number;
  distance: number;
  calories: number;
  date: string;
  startTime: string;
  markAsDone: boolean;
  sets?: number;
  reps?: number;
  weight?: number;
  intensity?: 'Low' | 'Medium' | 'High';
}

interface WeeklyStats {
  totalDistance: number;
  totalCalories: number;
  totalDuration: number;
  completedTasks: number;
  exercisesByType: { [key: string]: number };
}

interface ActivityTrend {
  dates: string[];
  distances: number[];
  durations: number[];
  calories: number[];
}

// Add a new interface for calorie intake
interface CalorieIntake {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
}

const FitnessTracker = () => {
  const [showDailyTasks, setShowDailyTasks] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddCalorieIntake, setShowAddCalorieIntake] = useState(false);
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [calorieIntakes, setCalorieIntakes] = useState<CalorieIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalDistance: 0,
    totalCalories: 0,
    totalDuration: 0,
    completedTasks: 0,
    exercisesByType: {}
  });
  const [activityTrend, setActivityTrend] = useState<ActivityTrend>({
    dates: [],
    distances: [],
    durations: [],
    calories: []
  });
  const [error, setError] = useState<string | null>(null);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2000);
  const [dailyCalorieIntake, setDailyCalorieIntake] = useState(0);

  useEffect(() => {
    fetchExerciseRecords();
  }, [currentWeekStart]);

  const fetchExerciseRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the start of the week (Sunday)
      const weekStart = new Date(currentWeekStart);
      weekStart.setHours(0, 0, 0, 0);
      
      // Get the end of the week (Saturday)
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      console.log('Fetching records for date range:', {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString()
      });

      const response = await axios.get('/api/user/ExerciseRecord', {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString()
        }
      });
      
      console.log('Received records:', response.data);
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

      setRecords(response.data);
      calculateWeeklyStats(response.data);
    } catch (error) {
      console.error('Error fetching exercise records:', error);
      setError('Failed to load exercise records. Please try again.');
      setRecords([]);
      setWeeklyStats({
        totalDistance: 0,
        totalCalories: 0,
        totalDuration: 0,
        completedTasks: 0,
        exercisesByType: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = (records: ExerciseRecord[]) => {
    const stats: WeeklyStats = {
      totalDistance: 0,
      totalCalories: 0,
      totalDuration: 0,
      completedTasks: 0,
      exercisesByType: {}
    };

    const trend: ActivityTrend = {
      dates: [],
      distances: [],
      durations: [],
      calories: []
    };

    // Group records by date
    const recordsByDate = records.reduce((acc: { [key: string]: ExerciseRecord[] }, record) => {
      const date = new Date(record.date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(record);
      return acc;
    }, {});

    // Calculate daily totals for trend data
    Object.entries(recordsByDate).forEach(([date, dayRecords]) => {
      const dailyStats = dayRecords.reduce(
        (acc, record) => {
          if (record.markAsDone) {
            acc.distance += record.distance;
            acc.duration += record.duration;
            acc.calories += record.calories;
          }
          return acc;
        },
        { distance: 0, duration: 0, calories: 0 }
      );

      trend.dates.push(date);
      trend.distances.push(dailyStats.distance);
      trend.durations.push(dailyStats.duration);
      trend.calories.push(dailyStats.calories);
    });

    // Calculate overall stats
    records.forEach(record => {
      if (record.markAsDone) {
        stats.totalDistance += record.distance;
        stats.totalCalories += record.calories;
        stats.totalDuration += record.duration;
        stats.completedTasks++;
        stats.exercisesByType[record.activity] = (stats.exercisesByType[record.activity] || 0) + 1;
      }
    });

    setWeeklyStats(stats);
    setActivityTrend(trend);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const toggleMarkAsDone = async (recordId: string, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/user/ExerciseRecord/${recordId}`, {
        markAsDone: !currentStatus
      });
      fetchExerciseRecords();
    } catch (error) {
      console.error('Error updating exercise status:', error);
    }
  };

  const groupExercisesByDate = (records: ExerciseRecord[]) => {
    const grouped: { [key: string]: ExerciseRecord[] } = {};
    records.forEach(record => {
      const date = new Date(record.date).toLocaleDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    return grouped;
  };

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    },
    plugins: {
      legend: {
        labels: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    }
  };

  const activityTrendData = {
    labels: activityTrend.dates,
    datasets: [
      {
        label: 'Distance (km)',
        data: activityTrend.distances,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Duration (min)',
        data: activityTrend.durations,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const caloriesTrendData = {
    labels: activityTrend.dates,
    datasets: [{
      label: 'Calories Burned',
      data: activityTrend.calories,
      backgroundColor: 'rgba(255, 159, 64, 0.7)',
      borderColor: 'rgb(255, 159, 64)',
      borderWidth: 1
    }]
  };

  const exerciseDistributionData = {
    labels: Object.keys(weeklyStats.exercisesByType),
    datasets: [{
      data: Object.values(weeklyStats.exercisesByType),
      backgroundColor: [
        'rgba(255, 99, 132, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 205, 86, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(153, 102, 255, 0.7)',
      ],
      borderWidth: 1
    }]
  };

  // Add this function to calculate daily calorie intake
  const calculateDailyCalorieIntake = () => {
    const today = new Date().toLocaleDateString();
    const todayIntakes = calorieIntakes.filter(intake => 
      new Date(intake.date).toLocaleDateString() === today
    );
    
    const total = todayIntakes.reduce((sum, intake) => sum + intake.calories, 0);
    setDailyCalorieIntake(total);
  };

  // Add this to the useEffect dependencies
  useEffect(() => {
    calculateDailyCalorieIntake();
  }, [calorieIntakes]);

  // Add a function to add calorie intake
  const addCalorieIntake = (newIntake: CalorieIntake) => {
    setCalorieIntakes([...calorieIntakes, newIntake]);
  };

  // Add this to the return statement, after the weekly stats section
  const renderCalorieIntakeSection = () => {
    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Calorie Intake</h2>
          <button
            onClick={() => setShowAddCalorieIntake(true)}
            className="bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Add Food
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-300">Daily Goal</span>
            <span className="text-white font-semibold">{dailyCalorieGoal} kcal</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                dailyCalorieIntake > dailyCalorieGoal ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (dailyCalorieIntake / dailyCalorieGoal) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-gray-400 text-sm">{dailyCalorieIntake} kcal consumed</span>
            <span className="text-gray-400 text-sm">
              {dailyCalorieIntake > dailyCalorieGoal 
                ? `${dailyCalorieIntake - dailyCalorieGoal} kcal over` 
                : `${dailyCalorieGoal - dailyCalorieIntake} kcal remaining`}
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {calorieIntakes
            .filter(intake => new Date(intake.date).toLocaleDateString() === new Date().toLocaleDateString())
            .map((intake, index) => (
              <div key={index} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium text-white">{intake.food}</span>
                  <span className="text-orange-400">{intake.calories} kcal</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>P: {intake.protein}g</span>
                  <span>C: {intake.carbs}g</span>
                  <span>F: {intake.fat}g</span>
                </div>
              </div>
            ))}
          {calorieIntakes.filter(intake => 
            new Date(intake.date).toLocaleDateString() === new Date().toLocaleDateString()
          ).length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No food entries for today
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Fitness Tracker</h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousWeek}
                className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="text-center">
                <span className="text-gray-400 text-sm">Week of</span>
                <div className="font-semibold">{currentWeekStart.toLocaleDateString()}</div>
              </div>
              <button
                onClick={handleNextWeek}
                className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDailyTasks(true);
                  setShowAddTask(false);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showDailyTasks ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Daily Tasks
              </button>
              <button
                onClick={() => {
                  setShowDailyTasks(false);
                  setShowAddTask(false);
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !showDailyTasks ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Analytics
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-orange-500">Loading...</div>
          </div>
        ) : (
          showDailyTasks ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h2 className="text-xl font-semibold mb-2 sm:mb-0">Daily Exercise Tasks</h2>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Exercise
                </button>
              </div>

              {/* Weekly Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400">Total Distance</p>
                      <p className="text-2xl font-bold">{weeklyStats.totalDistance.toFixed(2)} km</p>
                    </div>
                    <div className="bg-blue-500/20 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400">Calories Burned</p>
                      <p className="text-2xl font-bold">{weeklyStats.totalCalories.toFixed(0)}</p>
                    </div>
                    <div className="bg-orange-500/20 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400">Active Minutes</p>
                      <p className="text-2xl font-bold">{weeklyStats.totalDuration}</p>
                    </div>
                    <div className="bg-green-500/20 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400">Completed Tasks</p>
                      <p className="text-2xl font-bold">{weeklyStats.completedTasks}</p>
                    </div>
                    <div className="bg-purple-500/20 p-3 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Tasks and Calorie Intake */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Daily Tasks */}
                  {Object.entries(groupExercisesByDate(records)).map(([date, dayRecords]) => (
                    <div key={date} className="bg-gray-800 rounded-xl p-6 shadow-lg">
                      <h3 className="text-lg font-semibold mb-4">{date}</h3>
                      <div className="space-y-4">
                        {dayRecords.map((record) => (
                          <div
                            key={record._id}
                            className={`p-4 rounded-lg ${
                              record.markAsDone ? 'bg-gray-700/50' : 'bg-gray-700'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                              <div className="mb-2 sm:mb-0">
                                <h4 className="font-semibold">{record.activity}</h4>
                                <div className="text-sm text-gray-400 mt-1">
                                  <span>{record.duration} min</span>
                                  {record.distance > 0 && <span> • {record.distance} km</span>}
                                  {record.calories > 0 && <span> • {record.calories} calories</span>}
                                  {record.sets && <span> • {record.sets} sets</span>}
                                  {record.reps && <span> • {record.reps} reps</span>}
                                  {record.weight && <span> • {record.weight} kg</span>}
                                  {record.intensity && <span> • {record.intensity} intensity</span>}
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="text-sm text-gray-400 mr-3">{record.startTime}</span>
                                <button
                                  onClick={() => toggleMarkAsDone(record._id, record.markAsDone)}
                                  className={`px-3 py-1 rounded-lg ${
                                    record.markAsDone
                                      ? 'bg-green-500/20 text-green-500'
                                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                  }`}
                                >
                                  {record.markAsDone ? 'Completed' : 'Mark as Done'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {dayRecords.length === 0 && (
                          <div className="text-center text-gray-400 py-4">
                            No exercises scheduled for this day
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calorie Intake Section */}
                <div className="lg:col-span-1">
                  {renderCalorieIntakeSection()}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Activity Trends</h2>
                  <div className="h-80">
                    <Line
                      data={{
                        labels: activityTrend.dates,
                        datasets: [
                          {
                            label: 'Distance (km)',
                            data: activityTrend.distances,
                            borderColor: 'rgba(59, 130, 246, 0.8)',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            tension: 0.4,
                            fill: true
                          },
                          {
                            label: 'Duration (min)',
                            data: activityTrend.durations,
                            borderColor: 'rgba(16, 185, 129, 0.8)',
                            backgroundColor: 'rgba(16, 185, 129, 0.2)',
                            tension: 0.4,
                            fill: true
                          }
                        ]
                      }}
                      options={lineChartOptions}
                    />
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Calories Burned</h2>
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: activityTrend.dates,
                        datasets: [
                          {
                            label: 'Calories',
                            data: activityTrend.calories,
                            backgroundColor: 'rgba(249, 115, 22, 0.8)',
                            borderRadius: 6
                          }
                        ]
                      }}
                      options={lineChartOptions}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">Exercise Distribution</h2>
                  <div className="h-80 flex items-center justify-center">
                    {Object.keys(weeklyStats.exercisesByType).length > 0 ? (
                      <Doughnut
                        data={{
                          labels: Object.keys(weeklyStats.exercisesByType),
                          datasets: [
                            {
                              data: Object.values(weeklyStats.exercisesByType),
                              backgroundColor: [
                                'rgba(249, 115, 22, 0.8)',
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(139, 92, 246, 0.8)',
                                'rgba(236, 72, 153, 0.8)',
                                'rgba(245, 158, 11, 0.8)'
                              ],
                              borderWidth: 0
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                padding: 20,
                                font: {
                                  size: 12
                                }
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        No exercise data available
                      </div>
                    )}
                  </div>
                </div>

                {/* Calorie Intake Section in Analytics View */}
                <div>
                  {renderCalorieIntakeSection()}
                </div>
              </div>
            </div>
          )
        )}

        {/* Add Task Modal */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-lg max-w-md w-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Add Exercise Task</h2>
                <button 
                  onClick={() => setShowAddTask(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <AddExerciseRecord 
                onSuccess={() => {
                  setShowAddTask(false);
                  fetchExerciseRecords();
                }} 
                onCancel={() => setShowAddTask(false)}
              />
            </div>
          </div>
        )}

        {/* Add Calorie Intake Modal */}
        {showAddCalorieIntake && (
          <AddCalorieIntakeForm 
            onSuccess={(intake) => {
              addCalorieIntake(intake);
              setShowAddCalorieIntake(false);
            }}
            onCancel={() => setShowAddCalorieIntake(false)}
          />
        )}
      </div>
    </div>
  );
};

// Update AddExerciseRecord component
const AddExerciseRecord = ({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) => {
  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const formattedTime = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const [formData, setFormData] = useState({
    activity: 'Running',
    duration: '',
    distance: '',
    date: formattedDate,
    startTime: formattedTime,
    sets: '',
    reps: '',
    weight: '',
    intensity: 'Medium',
  });
  
  const [submitting, setSubmitting] = useState(false);

  const exerciseCategories = {
    'Cardio': ['Running', 'Walking', 'Cycling', 'Swimming', 'Jump Rope', 'Hiking'],
    'Strength Training': [
      'Push-ups', 'Pull-ups', 'Squats', 'Lunges', 'Deadlifts', 'Bench Press',
      'Shoulder Press', 'Bicep Curls', 'Tricep Extensions', 'Planks'
    ],
    'Flexibility': ['Yoga', 'Stretching', 'Pilates'],
    'Sports': ['Basketball', 'Tennis', 'Soccer', 'Volleyball'],
    'Other': ['HIIT', 'CrossFit', 'Dancing', 'Other']
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      // Calculate calories using our utility function
      const calories = calculateCaloriesBurned({
        activity: formData.activity,
        duration: parseFloat(formData.duration),
        distance: formData.distance ? parseFloat(formData.distance) : undefined,
        sets: formData.sets ? parseInt(formData.sets) : undefined,
        reps: formData.reps ? parseInt(formData.reps) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        intensity: formData.intensity as 'Low' | 'Medium' | 'High'
      });
      
      const recordData = {
        ...formData,
        duration: parseFloat(formData.duration),
        distance: parseFloat(formData.distance || '0'),
        calories,
        sets: formData.sets ? parseInt(formData.sets) : 0,
        reps: formData.reps ? parseInt(formData.reps) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : 0,
      };
      
      await axios.post('/api/user/ExerciseRecord', recordData);
      onSuccess();
    } catch (error) {
      console.error('Error adding exercise record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isStrengthTraining = exerciseCategories['Strength Training'].includes(formData.activity);
  
  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <label className="block text-gray-400 mb-2">Activity Type</label>
            <select 
              name="activity"
              value={formData.activity}
              onChange={handleChange}
              className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {Object.entries(exerciseCategories).map(([category, exercises]) => (
                <optgroup key={category} label={category}>
                  {exercises.map(exercise => (
                    <option key={exercise} value={exercise}>{exercise}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-700 p-4 rounded-lg">
            <label className="block text-gray-400 mb-2">Duration (minutes)</label>
            <input 
              type="number" 
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              placeholder="Enter duration"
              className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          {!isStrengthTraining && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <label className="block text-gray-400 mb-2">Distance (km)</label>
              <input 
                type="number" 
                name="distance"
                value={formData.distance}
                onChange={handleChange}
                placeholder="Enter distance"
                step="0.01"
                className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          {isStrengthTraining && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <label className="block text-gray-400 mb-2">Sets</label>
                  <input 
                    type="number" 
                    name="sets"
                    value={formData.sets}
                    onChange={handleChange}
                    placeholder="Sets"
                    className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <label className="block text-gray-400 mb-2">Reps</label>
                  <input 
                    type="number" 
                    name="reps"
                    value={formData.reps}
                    onChange={handleChange}
                    placeholder="Reps"
                    className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <label className="block text-gray-400 mb-2">Weight (kg)</label>
                  <input 
                    type="number" 
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="Weight"
                    step="0.5"
                    className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg col-span-2">
              <label className="block text-gray-400 mb-2">Date</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg">
              <label className="block text-gray-400 mb-2">Intensity</label>
              <select 
                name="intensity"
                value={formData.intensity}
                onChange={handleChange}
                className="w-full bg-gray-600 text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-white bg-gray-600 rounded-lg hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding..." : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

// Add this component for adding calorie intake
const AddCalorieIntakeForm = ({ onSuccess, onCancel }: { onSuccess: (intake: CalorieIntake) => void, onCancel: () => void }) => {
  const [formData, setFormData] = useState<Omit<CalorieIntake, 'date'>>({
    food: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'food' ? value : Number(value)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIntake: CalorieIntake = {
      ...formData,
      date: new Date().toISOString()
    };
    onSuccess(newIntake);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Food</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Food Name</label>
            <input
              type="text"
              name="food"
              value={formData.food}
              onChange={handleChange}
              required
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Calories (kcal)</label>
            <input
              type="number"
              name="calories"
              value={formData.calories}
              onChange={handleChange}
              required
              min="0"
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-1">Protein (g)</label>
              <input
                type="number"
                name="protein"
                value={formData.protein}
                onChange={handleChange}
                min="0"
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Carbs (g)</label>
              <input
                type="number"
                name="carbs"
                value={formData.carbs}
                onChange={handleChange}
                min="0"
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Fat (g)</label>
              <input
                type="number"
                name="fat"
                value={formData.fat}
                onChange={handleChange}
                min="0"
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
            >
              Add Food
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FitnessTracker;