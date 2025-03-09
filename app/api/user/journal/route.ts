import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Journal from "@/models/journal";
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
    const journals = await Journal.find({ userId: user._id })
      .sort({ createdAt: -1 });

    return NextResponse.json(journals, { status: 200 });
  } catch (error) {
    console.error("Error fetching journals:", error);
    return NextResponse.json(
      { message: "Failed to fetch journals", error },
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
    
    // Process tags if they come as a comma-separated string
    const tags = typeof data.tags === 'string' 
      ? data.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : data.tags || [];

    const journal = await Journal.create({
      ...data,
      userId: user._id,
      tags
    });

    return NextResponse.json({ message: "Journal entry created successfully", journal }, { status: 201 });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json(
      { message: "Failed to create journal entry", error },
      { status: 500 }
    );
  }
}
