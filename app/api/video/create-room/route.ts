import { NextResponse } from "next/server";
import Doctor from "@/models/doctor";
import Appointment from "@/models/appointment";
import Notification from "@/models/Notification";
import User from "@/models/User";
import dbConnect from "@/lib/mongodb";
import { verify, JwtPayload } from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface DecodedToken extends JwtPayload {
  email?: string;
  id?: string;
  name?: string;
  role?: string;
}

// Helper function to verify JWT token
const verifyToken = (token: string): DecodedToken | null => {
  try {
    return verify(token, process.env.JWT_SECRET || 'fallback_secret') as DecodedToken;
  } catch (error) {
    return null;
  }
};

// We'll use Daily.co for video calls
const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

// Function to generate a fallback meeting URL if Daily.co is not configured
const generateFallbackMeetingUrl = (appointmentId: string) => {
  // Generate a unique room name based on appointment ID
  const roomName = `appointment-${appointmentId}`;
  
  // Use Jitsi Meet as fallback (works across browsers without authentication)
  return `https://meet.jit.si/wellbee-${roomName}#config.prejoinPageEnabled=false&config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.disableDeepLinking=true&config.hideConferenceSubject=true&config.hideConferenceTimer=true&config.disableInviteFunctions=true`;
};

export async function POST(request: Request) {
  try {
    // Try to get session from NextAuth first
    const session = await getServerSession(authOptions);
    let userEmail = session?.user?.email;
    
    // If no NextAuth session, try JWT token
    if (!userEmail) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (decoded?.email) {
          userEmail = decoded.email;
        }
      }
    }
    
    // If still no user email, return unauthorized
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get request body
    const body = await request.json();
    const { appointmentId } = body;

    // Validate required fields
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointment ID' },
        { status: 400 }
      );
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('doctorId', 'name email specialization');
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if the appointment is already in progress
    if (appointment.status === 'in-progress' && appointment.meetingLink) {
      return NextResponse.json({
        meetingLink: appointment.meetingLink,
        appointment
      });
    }

    // Find doctor by email
    const doctor = await Doctor.findOne({ email: userEmail });

    // Only allow doctors to create/start the room
    if (!doctor) {
      return NextResponse.json(
        { error: 'Only doctors can start video calls' },
        { status: 403 }
      );
    }

    // Verify this is the correct doctor for the appointment
    if (appointment.doctorId._id.toString() !== doctor._id.toString()) {
      return NextResponse.json(
        { error: 'Unauthorized to create room for this appointment' },
        { status: 403 }
      );
    }

    let meetingLink;

    // If Daily.co API key is available, use it to create a room
    if (DAILY_API_KEY) {
      try {
        // Create Daily.co room
        const expiryDate = new Date(appointment.date);
        expiryDate.setHours(expiryDate.getHours() + 1); // Room expires 1 hour after appointment time

        const response = await fetch(`${DAILY_API_URL}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            name: `appointment-${appointmentId}`,
            properties: {
              enable_chat: true,
              enable_screenshare: true,
              enable_recording: 'cloud',
              exp: Math.floor(expiryDate.getTime() / 1000),
              max_participants: 2,
              enable_knocking: false,
              start_video_off: false,
              start_audio_off: false,
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Daily API error:', errorData);
          throw new Error(`Failed to create Daily.co room: ${response.status} ${response.statusText}`);
        }

        const room = await response.json();
        meetingLink = room.url;
        console.log('Successfully created Daily.co room:', meetingLink);
      } catch (error) {
        console.error('Error creating Daily.co room:', error);
        // Fall back to alternative meeting URL
        meetingLink = generateFallbackMeetingUrl(appointmentId);
        console.log('Using fallback meeting URL:', meetingLink);
      }
    } else {
      // Use fallback meeting URL if Daily.co is not configured
      console.log('Daily API key not configured, using fallback meeting URL');
      meetingLink = generateFallbackMeetingUrl(appointmentId);
    }

    // Update appointment with meeting link and status
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        meetingLink,
        status: 'in-progress',
        lastUpdated: new Date()
      },
      { new: true }
    ).populate('doctorId', 'name specialization');

    // Create notification for the patient
    try {
      // Find the user by patient email
      const patientEmail = appointment.patientId.toString();
      const user = await User.findOne({ email: patientEmail });
      
      if (user && doctor) {
        console.log(`Creating video call notification for user ${user._id} from doctor ${doctor._id}`);
        
        // Create a notification with clear message and proper formatting
        await Notification.create({
          userId: user._id,
          fromUser: doctor._id,
          type: 'video',
          message: `Dr. ${doctor.name} has started your video consultation. Join now!`,
          read: false,
          createdAt: new Date()
        });
        
        console.log('Video call notification created successfully');
      } else {
        console.log(`Could not create notification: user=${!!user}, doctor=${!!doctor}`);
      }
    } catch (notifError) {
      // Log but don't fail if notification creation fails
      console.error('Error creating notification:', notifError);
    }

    return NextResponse.json({
      meetingLink,
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error creating video room:', error);
    return NextResponse.json(
      { error: 'Failed to create video room' },
      { status: 500 }
    );
  }
} 