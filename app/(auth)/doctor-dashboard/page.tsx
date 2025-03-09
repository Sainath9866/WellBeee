"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Calendar from 'react-calendar';
import type { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';
import '../medical-assistance/calendar-styles.css';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialization: string;
  workingHours: {
    start: string;
    end: string;
  };
  maxAppointmentsPerDay: number;
  availableDays: string[];
}

interface Appointment {
  _id: string;
  patientId: string;
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  symptoms: string;
  status: string;
  type: string;
  meetingLink?: string;
}

export default function DoctorDashboard() {
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [workingHours, setWorkingHours] = useState({
    start: '09:00',
    end: '17:00'
  });
  const [maxAppointments, setMaxAppointments] = useState(10);
  const [availableDays, setAvailableDays] = useState<string[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'
  ]);

  useEffect(() => {
    // Check if doctor is logged in
    const token = localStorage.getItem('doctorToken');
    if (!token) {
      router.push('/doctor-login');
      return;
    }

    fetchDoctorProfile(token);
  }, [router]);

  useEffect(() => {
    if (selectedDate && doctor) {
      fetchAppointments();
    }
  }, [selectedDate, doctor]);

  const fetchDoctorProfile = async (token: string) => {
    try {
      const response = await axios.get('/api/doctor/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const doctorData = response.data;
      setDoctor(doctorData);
      setWorkingHours(doctorData.workingHours);
      setMaxAppointments(doctorData.maxAppointmentsPerDay);
      setAvailableDays(doctorData.availableDays);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
      setError('Failed to load doctor profile');
      
      // If unauthorized, redirect to login
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('doctorToken');
        router.push('/doctor-login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      if (!token) return;

      const response = await axios.get('/api/appointments', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          date: selectedDate.toISOString()
        }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
    }
  };

  const updateDoctorSettings = async () => {
    try {
      const token = localStorage.getItem('doctorToken');
      if (!token) return;

      await axios.patch('/api/doctor/profile', {
        workingHours,
        maxAppointmentsPerDay: maxAppointments,
        availableDays
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setShowSettings(false);
      fetchDoctorProfile(token);
    } catch (error) {
      console.error('Error updating doctor settings:', error);
      setError('Failed to update settings');
    }
  };

  const startVideoCall = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem('doctorToken');
      if (!token) return;

      const response = await axios.post('/api/video/create-room', {
        appointmentId
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      window.open(response.data.meetingLink, '_blank');
    } catch (error) {
      console.error('Error starting video call:', error);
      setError('Failed to start video call');
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const token = localStorage.getItem('doctorToken');
      if (!token) return;

      await axios.patch('/api/appointments', {
        appointmentId,
        status
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    router.push('/doctor-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-orange-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
            {doctor && (
              <p className="text-gray-400">
                Dr. {doctor.name} - {doctor.specialization}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Schedule</h2>
            <div className="calendar-container bg-gray-700 p-2 rounded-lg">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                className="w-full !bg-gray-700 text-white rounded-lg border-gray-700"
              />
            </div>
          </div>

          {/* Appointments */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">
              Appointments for {selectedDate.toLocaleDateString()}
            </h2>
            <div className="space-y-4">
              {appointments.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
                  No appointments scheduled for this day
                </div>
              ) : (
                appointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="bg-gray-800 rounded-xl p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">
                          {appointment.timeSlot.start} - {appointment.timeSlot.end}
                        </h3>
                        <p className="text-gray-400">Patient ID: {appointment.patientId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {appointment.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => startVideoCall(appointment._id)}
                              className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 transition-colors"
                            >
                              Start Call
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                              className="bg-red-500/10 text-red-500 px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {appointment.status === 'in-progress' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                            className="bg-green-500/10 text-green-500 px-3 py-1 rounded hover:bg-green-500/20 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                    {appointment.symptoms && (
                      <div className="mt-2 text-sm text-gray-400">
                        <p className="font-medium">Symptoms:</p>
                        <p>{appointment.symptoms}</p>
                      </div>
                    )}
                    <div className="mt-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          appointment.status === 'scheduled'
                            ? 'bg-blue-500/10 text-blue-500'
                            : appointment.status === 'in-progress'
                            ? 'bg-orange-500/10 text-orange-500'
                            : appointment.status === 'completed'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-lg">
              <div className="flex justify-between items-center p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Doctor Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-gray-400 mb-2">Working Hours</label>
                  <div className="flex gap-4">
                    <input
                      type="time"
                      value={workingHours.start}
                      onChange={(e) =>
                        setWorkingHours({ ...workingHours, start: e.target.value })
                      }
                      className="bg-gray-700 text-white p-2 rounded-lg"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={workingHours.end}
                      onChange={(e) =>
                        setWorkingHours({ ...workingHours, end: e.target.value })
                      }
                      className="bg-gray-700 text-white p-2 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">
                    Maximum Appointments per Day
                  </label>
                  <input
                    type="number"
                    value={maxAppointments}
                    onChange={(e) => setMaxAppointments(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Available Days</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                      (day) => (
                        <label
                          key={day}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={availableDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAvailableDays([...availableDays, day]);
                              } else {
                                setAvailableDays(
                                  availableDays.filter((d) => d !== day)
                                );
                              }
                            }}
                            className="text-orange-500 rounded border-gray-600 focus:ring-orange-500"
                          />
                          <span className="text-gray-300">{day}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateDoctorSettings}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 