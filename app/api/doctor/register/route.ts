import { NextResponse } from 'next/server';
import Doctor from '@/models/doctor';
import dbConnect from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function POST(request: Request) {
  try {
    // Connect to database
    await dbConnect();

    // Get request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const {
      name,
      email,
      password,
      specialization,
      qualification,
      experience,
      workingHours,
      availableDays,
      maxAppointmentsPerDay,
      about,
      profileImage
    } = body;

    // Check if doctor with this email already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return NextResponse.json(
        { error: 'Email already registered. Please use a different email.' },
        { status: 400 }
      );
    }

    // Create doctor profile
    try {
      // Convert experience to number
      const experienceNum = Number(experience);
      if (isNaN(experienceNum)) {
        throw new Error('Experience must be a number');
      }

      // Convert maxAppointmentsPerDay to number
      const maxAppointmentsNum = Number(maxAppointmentsPerDay) || 10;
      if (isNaN(maxAppointmentsNum)) {
        throw new Error('Max appointments must be a number');
      }

      // Validate availableDays
      if (!Array.isArray(availableDays) || availableDays.length === 0) {
        throw new Error('At least one available day is required');
      }

      // Validate workingHours
      if (!workingHours || !workingHours.start || !workingHours.end) {
        throw new Error('Working hours are required');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const doctorData = {
        email,
        password: hashedPassword,
        name,
        specialization,
        qualification,
        experience: experienceNum,
        workingHours,
        availableDays,
        maxAppointmentsPerDay: maxAppointmentsNum,
        about: about || '',
        profileImage: profileImage || '',
        ratings: [],
        averageRating: 0,
        isAvailable: true
      };

      console.log("Creating doctor with data:", { ...doctorData, password: '[HIDDEN]' });
      const doctor = await Doctor.create(doctorData);

      return NextResponse.json({
        message: 'Doctor registration successful',
        doctor: {
          name: doctor.name,
          email: doctor.email,
          specialization: doctor.specialization
        }
      });
    } catch (error) {
      console.error("Doctor creation error:", error);
      
      if (error instanceof mongoose.Error.ValidationError) {
        const validationErrors = Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }));
        
        return NextResponse.json(
          { 
            error: 'Validation failed',
            details: validationErrors 
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to create doctor profile', message: (error as Error).message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error registering doctor:', error);
    return NextResponse.json(
      { error: 'Failed to register doctor', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Connect to database
    await dbConnect();

    // Fetch all doctors with their ratings
    const doctors = await Doctor.find({ isAvailable: true })
      .select('name specialization qualification experience workingHours availableDays ratings averageRating about profileImage')
      .sort({ averageRating: -1 });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch doctors' },
      { status: 500 }
    );
  }
}