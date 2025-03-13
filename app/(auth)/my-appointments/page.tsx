"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Appointment {
  _id: string;
  doctorId: {
    _id: string;
    name: string;
    specialization: string;
  };
  date: string;
  timeSlot: {
    start: string;
    end: string;
  };
  symptoms: string;
  status: string;
  meetingLink?: string;
}

export default function MyAppointments() {
  const { data: session } = useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (session) {
      fetchAppointments();
      
      // Set up interval to check for updates every 5 seconds (more frequent)
      const interval = setInterval(fetchAppointments, 5000);
      
      // Request notification permission on page load
      if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
      
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments');
      
      // Sort appointments by date (latest first)
      const sortedAppointments = response.data.sort((a: Appointment, b: Appointment) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setAppointments(sortedAppointments);
      
      // If we're not in loading state (not the first load)
      if (!loading) {
        // Check for new in-progress appointments
        const newInProgress = sortedAppointments.filter(
          (apt: Appointment) => apt.status === 'in-progress' && apt.meetingLink
        );
        
        // Compare with current appointments to find newly started calls
        if (appointments.length > 0 && newInProgress.length > 0) {
          const previousInProgress = appointments.filter(
            apt => apt.status === 'in-progress' && apt.meetingLink
          );
          
          // Find appointments that were not in-progress before but are now
          for (const newApt of newInProgress) {
            const wasInProgress = previousInProgress.some(
              prevApt => prevApt._id === newApt._id && prevApt.status === 'in-progress'
            );
            
            if (!wasInProgress) {
              console.log('New in-progress appointment detected:', newApt);
              
              // Show browser notification
              if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification('Video Call Started', {
                  body: `Your appointment with Dr. ${newApt.doctorId.name} is ready to join`,
                  icon: '/favicon.ico',
                  requireInteraction: true
                });
                
                notification.onclick = () => {
                  window.focus();
                  router.push('/my-appointments');
                };
              }
              
              // Play sound
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => console.log('Could not play notification sound:', e));
              
              // Show alert
              alert(`Your doctor is ready! Dr. ${newApt.doctorId.name} has started the video call.`);
            }
          }
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const joinMeeting = (meetingLink: string) => {
    // Log the meeting link for debugging
    console.log('Joining meeting with link:', meetingLink);
    
    // Open in a new tab with specific features
    const newWindow = window.open(
      meetingLink, 
      '_blank',
      'noopener,noreferrer,width=1200,height=800,top=50,left=50'
    );
    
    // Focus the new window if possible
    if (newWindow) {
      newWindow.focus();
    } else {
      // If window.open is blocked, show a message
      alert('Your browser blocked opening the video call. Please click the link again or check your popup blocker settings.');
    }
  };

  // Helper function to determine if appointment time has arrived
  const isAppointmentTime = (appointment: Appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const [hours, minutes] = appointment.timeSlot.start.split(':');
    appointmentDate.setHours(parseInt(hours), parseInt(minutes));
    
    // Allow joining 5 minutes before the scheduled time
    const joinWindow = new Date(appointmentDate);
    joinWindow.setMinutes(joinWindow.getMinutes() - 5);
    
    return now >= joinWindow;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please sign in to view your appointments</p>
          <Link href="/signin" className="bg-orange-500 text-white px-4 py-2 rounded-lg">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Appointments</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="text-orange-500">Loading...</div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-gray-400">You don't have any appointments yet.</p>
            <Link href="/medical-assistance" className="mt-4 inline-block bg-orange-500 text-white px-4 py-2 rounded-lg">
              Book an Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="bg-gray-800 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">Dr. {appointment.doctorId.name}</h2>
                    <p className="text-gray-400">{appointment.doctorId.specialization}</p>
                    <p className="mt-2">{formatDate(appointment.date)}</p>
                    <p className="text-gray-400">
                      {appointment.timeSlot.start} - {appointment.timeSlot.end}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm ${
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

                {appointment.symptoms && (
                  <div className="mt-2 mb-4">
                    <p className="text-sm text-gray-400">Symptoms:</p>
                    <p>{appointment.symptoms}</p>
                  </div>
                )}

                <div className="mt-4">
                  {appointment.status === 'in-progress' && appointment.meetingLink ? (
                    <button
                      onClick={() => joinMeeting(appointment.meetingLink!)}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Join Video Call
                    </button>
                  ) : appointment.status === 'scheduled' ? (
                    isAppointmentTime(appointment) ? (
                      <p className="text-sm text-gray-400">
                        Waiting for the doctor to start the video call...
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        The video call will be available at the scheduled time.
                      </p>
                    )
                  ) : (
                    <p className="text-sm text-gray-400">
                      This appointment is {appointment.status}.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 