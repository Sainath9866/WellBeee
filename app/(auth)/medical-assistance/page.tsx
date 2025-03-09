"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import Calendar from 'react-calendar';
import type { Value } from 'react-calendar/dist/cjs/shared/types';
import 'react-calendar/dist/Calendar.css';
import './calendar-styles.css';

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  workingHours: {
    start: string;
    end: string;
  };
  availableDays: string[];
  averageRating: number;
  ratings: Array<{
    rating: number;
    review: string;
    date: string;
  }>;
}

interface TimeSlot {
  start: string;
  end: string;
}

export default function MedicalAssistance() {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = (doctor: Doctor, date: Date): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const [startHour, startMinute] = doctor.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = doctor.workingHours.end.split(':').map(Number);
    
    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0);

    // Use 15-minute intervals for more slots
    while (currentTime < endTime) {
      const start = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Add 15 minutes
      currentTime.setMinutes(currentTime.getMinutes() + 15);
      
      // If we've gone past the end time, break
      if (currentTime > endTime) break;
      
      const end = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      slots.push({ start, end });
    }

    return slots;
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    try {
      // Check if user is logged in
      if (!session || !session.user) {
        setError('You must be logged in to book an appointment');
        return;
      }

      await axios.post('/api/appointments', {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        symptoms,
        type: 'video'
      });

      // Show success message
      setError(null);
      setShowBooking(false);
      setSelectedDoctor(null);
      setSelectedSlot(null);
      setSymptoms('');
      
      // Show success alert
      alert('Appointment booked successfully!');
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    }
  };

  // Add a handler for calendar date changes
  const handleDateChange = (value: Value) => {
    if (value instanceof Date) {
      setSelectedDate(value);
    }
  };

  // Function to check if a date should be disabled (weekends or doctor's off days)
  const tileDisabled = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false;
    
    if (!selectedDoctor) return false;
    
    // Get day name
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if the day is in doctor's available days
    return !selectedDoctor.availableDays.includes(dayName);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Medical Assistance</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-orange-500">Loading...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctors List */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doctor) => (
                  <div key={doctor._id} className="bg-gray-800 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">Dr. {doctor.name}</h2>
                        <p className="text-gray-400">{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{doctor.averageRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>{doctor.qualification}</p>
                      <p>{doctor.experience} years of experience</p>
                      <p>
                        Available: {doctor.workingHours.start} - {doctor.workingHours.end}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setShowBooking(true);
                      }}
                      className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Information Panel */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">How it works</h2>
              <div className="space-y-4 text-gray-400">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    1
                  </div>
                  <p>Choose a doctor based on their specialization and availability</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    2
                  </div>
                  <p>Select a convenient date and time for your appointment</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    3
                  </div>
                  <p>Describe your symptoms or concerns</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                    4
                  </div>
                  <p>Join the video consultation at your scheduled time</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBooking && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-800 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
                <h2 className="text-xl font-semibold">Book Appointment</h2>
                <button
                  onClick={() => {
                    setShowBooking(false);
                    setSelectedDoctor(null);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Dr. {selectedDoctor.name}</h3>
                  <p className="text-gray-400">{selectedDoctor.specialization}</p>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Select Date</label>
                  <div className="calendar-container bg-gray-700 p-2 rounded-lg">
                    <Calendar
                      onChange={handleDateChange}
                      value={selectedDate}
                      minDate={new Date()}
                      className="w-full !bg-gray-700 text-white rounded-lg border-gray-700"
                      tileDisabled={tileDisabled}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Available Time Slots</label>
                  <div className="time-slots-container">
                    {getAvailableSlots(selectedDoctor, selectedDate).length > 0 ? (
                      getAvailableSlots(selectedDoctor, selectedDate).map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            console.log('Selected slot:', slot);
                            setSelectedSlot(slot);
                          }}
                          className={`p-2 rounded-lg text-sm m-1 ${
                            selectedSlot && selectedSlot.start === slot.start && selectedSlot.end === slot.end
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                          }`}
                        >
                          {slot.start}
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-400">
                        No available slots for this date
                      </div>
                    )}
                  </div>
                  {selectedSlot && (
                    <div className="mt-2 text-sm text-green-500">
                      Selected time: {selectedSlot.start} - {selectedSlot.end}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Describe your symptoms</label>
                  <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                    placeholder="Please describe your symptoms or concerns..."
                  />
                </div>

                <div className="flex gap-4 pt-2 sticky bottom-0">
                  <button
                    onClick={() => {
                      setShowBooking(false);
                      setSelectedDoctor(null);
                    }}
                    className="flex-1 py-2 text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot}
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Booking
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