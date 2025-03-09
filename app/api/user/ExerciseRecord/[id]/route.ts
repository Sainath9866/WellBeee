import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import ExerciseRecord from "@/models/ExerciseRecord";
import dbConnect from "../../../../lib/mongodb.js";
import mongoose from "mongoose";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    const record = await ExerciseRecord.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: data },
      { new: true }
    );

    if (!record) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Exercise record updated successfully", record }, { status: 200 });
  } catch (error) {
    console.error("Error updating exercise record:", error);
    return NextResponse.json(
      { message: "Failed to update exercise record", error },
      { status: 500 }
    );
  }
} 