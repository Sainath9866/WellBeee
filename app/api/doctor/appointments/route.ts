import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Doctor from "@/models/doctor";
import Appointment from "@/models/appointment";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET(req: Request) {
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error("Error connecting to database:", error);
    return NextResponse.json({ message: "Database connection error", error }, { status: 500 });
  }

  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}));
  const user = await User.findOne({ email: session.user?.email });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  try {
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) {
      return NextResponse.json({ message: "Doctor profile not found" }, { status: 404 });
    }

    // Get date from query params
    const url = new URL(req.url);
    const dateStr = url.searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();

    // Set time to start of day
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    const appointments = await Appointment.find({
      doctorId: doctor._id,
      date: {
        $gte: date,
        $lt: nextDay
      }
    }).populate('patientId', 'name email');

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { message: "Failed to fetch appointments", error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ message: "Internal server error", error }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error("Error connecting to database:", error);
    return NextResponse.json({ message: "Database connection error", error }, { status: 500 });
  }

  const User = mongoose.models.User || mongoose.model("User", new mongoose.Schema({}));
  const user = await User.findOne({ email: session.user?.email });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  try {
    const doctor = await Doctor.findOne({ userId: user._id });
    if (!doctor) {
      return NextResponse.json({ message: "Doctor profile not found" }, { status: 404 });
    }

    const data = await req.json();
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    // Check if slot is available
    const existingAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      date: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAppointments >= doctor.maxAppointmentsPerDay) {
      return NextResponse.json(
        { message: "No available slots for this day" },
        { status: 400 }
      );
    }

    // Check if time slot is valid
    const [startHour, startMinute] = data.timeSlot.start.split(':').map(Number);
    const appointmentStart = new Date(date);
    appointmentStart.setHours(startHour, startMinute);

    if (!doctor.workingHours || !doctor.workingHours.start) {
      return NextResponse.json(
        { message: "Doctor's working hours are not set" },
        { status: 400 }
      );
    }
    const [doctorStartHour, doctorStartMinute] = doctor.workingHours.start.split(':').map(Number);
    if (!doctor.workingHours || !doctor.workingHours.end) {
      return NextResponse.json(
        { message: "Doctor's working hours are not set" },
        { status: 400 }
      );
    }
    const [doctorEndHour, doctorEndMinute] = doctor.workingHours.end.split(':').map(Number);

    const workStart = new Date(date);
    workStart.setHours(doctorStartHour, doctorStartMinute);

    const workEnd = new Date(date);
    workEnd.setHours(doctorEndHour, doctorEndMinute);

    if (appointmentStart < workStart || appointmentStart >= workEnd) {
      return NextResponse.json(
        { message: "Appointment time is outside working hours" },
        { status: 400 }
      );
    }

    const appointment = await Appointment.create({
      ...data,
      doctorId: doctor._id
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { message: "Failed to create appointment", error },
      { status: 500 }
    );
  }
} 