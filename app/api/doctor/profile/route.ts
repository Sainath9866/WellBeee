import { NextResponse } from "next/server";
import Doctor from "@/models/doctor";
import dbConnect from "@/lib/mongodb";
import { verify, JwtPayload } from 'jsonwebtoken';

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

export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Find doctor profile using email
    const doctor = await Doctor.findOne({ email: decoded.email })
      .select('-password'); // Exclude password from response
    
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract and verify token
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Find doctor profile using email
    const doctor = await Doctor.findOne({ email: decoded.email });
    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const {
      name,
      specialization,
      qualification,
      experience,
      workingHours,
      availableDays,
      maxAppointmentsPerDay,
      about,
      profileImage,
      isAvailable
    } = body;

    // Update doctor profile
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctor._id,
      {
        $set: {
          name: name || doctor.name,
          specialization: specialization || doctor.specialization,
          qualification: qualification || doctor.qualification,
          experience: experience || doctor.experience,
          workingHours: workingHours || doctor.workingHours,
          availableDays: availableDays || doctor.availableDays,
          maxAppointmentsPerDay: maxAppointmentsPerDay || doctor.maxAppointmentsPerDay,
          about: about || doctor.about,
          profileImage: profileImage || doctor.profileImage,
          isAvailable: typeof isAvailable === "boolean" ? isAvailable : doctor.isAvailable
        }
      },
      { new: true }
    ).select('-password'); // Exclude password from response

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return NextResponse.json(
      { error: "Failed to update doctor profile" },
      { status: 500 }
    );
  }
} 