import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import ExerciseRecord from "@/models/ExerciseRecord";
import dbConnect from "../../../lib/mongodb.js";
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
    // Get date range from query parameters
    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    console.log('Raw date parameters:', { startDateStr, endDateStr });

    let query: any = { userId: user._id };
    
    if (startDateStr && endDateStr) {
      try {
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        query.date = {
          $gte: startDate,
          $lte: endDate
        };

        console.log('Date range query:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
      } catch (dateError) {
        console.error('Error parsing dates:', dateError);
        return NextResponse.json(
          { message: "Invalid date format", error: dateError },
          { status: 400 }
        );
      }
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    const records = await ExerciseRecord.find(query)
      .sort({ date: -1, startTime: -1 });

    console.log(`Found ${records.length} records for user ${user._id}`);

    if (records.length === 0) {
      console.log('No records found for query');
    } else {
      console.log('Date range of found records:', {
        earliest: new Date(Math.min(...records.map(r => r.date.getTime()))).toISOString(),
        latest: new Date(Math.max(...records.map(r => r.date.getTime()))).toISOString()
      });
    }

    return NextResponse.json(records, { status: 200 });
  } catch (error) {
    console.error("Error fetching exercise records:", error);
    return NextResponse.json(
      { message: "Failed to fetch exercise records", error },
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
    const data = await req.json();
    const record = await ExerciseRecord.create({
      ...data,
      userId: user._id,
      date: new Date(data.date),
      markAsDone: false
    });

    return NextResponse.json({ message: "Exercise record created successfully", record }, { status: 201 });
  } catch (error) {
    console.error("Error creating exercise record:", error);
    return NextResponse.json(
      { message: "Failed to create exercise record", error },
      { status: 500 }
    );
  }
}
