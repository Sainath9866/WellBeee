import { NextResponse } from 'next/server';
import Doctor from '@/models/doctor';
import Appointment from '@/models/appointment';
import Notification from '@/models/Notification';
import User from '@/models/User';
import dbConnect from '@/lib/mongodb';
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

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { doctorId, date, timeSlot, type } = body;

    // Get user from session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find user by email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add patientId to the appointment data
    const appointmentData = {
      ...body,
      patientId: user._id,
      status: 'scheduled'
    };

    // Fetch doctor's availability
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Check if the selected day is available
    const selectedDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctor.availableDays.includes(selectedDay)) {
      return NextResponse.json({ 
        error: 'Doctor is not available on this day',
        availableDays: doctor.availableDays 
      }, { status: 400 });
    }

    // Check working hours
    const appointmentStart = timeSlot.start;
    const appointmentEnd = timeSlot.end;
    if (!doctor.workingHours || appointmentStart < doctor.workingHours.start || appointmentEnd > doctor.workingHours.end) {
      return NextResponse.json({ 
        error: 'Appointment time is outside doctor\'s working hours',
        workingHours: doctor.workingHours 
      }, { status: 400 });
    }

    // Check existing appointments for the day
    const existingAppointments = await Appointment.countDocuments({
      doctorId,
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59))
      }
    });

    if (existingAppointments >= doctor.maxAppointmentsPerDay) {
      return NextResponse.json({ 
        error: 'Doctor has reached maximum appointments for this day' 
      }, { status: 400 });
    }

    // For video appointments, generate a fallback meeting URL if needed
    if (type === 'video') {
      // Generate a unique room name based on timestamp and random string
      const roomId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Use Jitsi Meet as fallback (works across browsers without authentication)
      appointmentData.meetingLink = `https://meet.jit.si/wellbee-${roomId}#config.prejoinPageEnabled=false`;
    }

    // Create the appointment
    const appointment = await Appointment.create(appointmentData);

    // Create notification for the doctor
    try {
      await Notification.create({
        userId: doctor._id,
        fromUser: user._id,
        type: 'appointment',
        message: `New appointment scheduled with ${user.name} on ${new Date(date).toLocaleDateString()} at ${timeSlot.start}`,
        read: false,
        createdAt: new Date()
      });
    } catch (notifError) {
      // Log but don't fail if notification creation fails
      console.error('Error creating notification:', notifError);
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const doctorId = searchParams.get('doctorId');

    let query = {};
    if (userId) query = { patientId: userId };
    if (doctorId) query = { doctorId };

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name specialization')
      .populate('patientId', 'name email')
      .sort({ date: -1, 'timeSlot.start': -1 }); // Sort by latest first

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const { appointmentId, status, rating, review } = body;

    // Validate required fields
    if (!appointmentId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Find doctor by email
    const doctor = await Doctor.findOne({ email: userEmail });

    // Check if user is authorized to update the appointment
    if (!doctor && appointment.patientId !== userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized to update this appointment' },
        { status: 403 }
      );
    }

    // Update appointment
    const updateData: any = { status };
    if (rating && review) {
      updateData.rating = {
        score: rating,
        review,
        date: new Date()
      };

      // Update doctor's average rating
      if (doctor) {
        const ratings = [...doctor.ratings, { rating, review, date: new Date() }];
        const averageRating = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;
        await Doctor.findByIdAndUpdate(doctor._id, {
          $push: { ratings: { rating, review, date: new Date() } },
          $set: { averageRating }
        });
      }
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    ).populate('doctorId', 'name specialization');

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
} 