import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

import { User } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { s3 } from "@/lib/server/s3";

// Points awarded for uploading a profile picture
const PROFILE_PICTURE_POINTS = 1000;

export async function POST(request: NextRequest) {
  const session = (await getServerSession()) as ExtendedSession;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get form data (profile picture)
    const formData = await request.formData();
    const file = formData.get("profilePicture") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported. Please upload an image." },
        { status: 400 }
      );
    }

    // Generate a unique file name
    const fileExtension = file.name.split(".").pop();
    const fileName = `profile-pictures/${
      session.user.id
    }/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3.send(command);

    // Generate public URL
    const profilePictureUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

    // Find user and update
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if points should be awarded
    let pointsAwarded = 0;
    const profileFlags = user.profileCompletionFlags || {
      nameAdded: false,
      phoneAdded: false,
      profilePictureAdded: false,
    };

    if (!profileFlags.profilePictureAdded) {
      pointsAwarded = PROFILE_PICTURE_POINTS;
      profileFlags.profilePictureAdded = true;
      user.totalLoyaltyPoints += pointsAwarded;
      user.unspentLoyaltyPoints += pointsAwarded;
    }

    // Update user's profile picture and flags
    user.profilePicture = profilePictureUrl;
    user.profileCompletionFlags = profileFlags;
    await user.save();

    return NextResponse.json({
      success: true,
      profilePicture: profilePictureUrl,
      pointsAwarded,
      totalPoints: user.totalLoyaltyPoints,
      unspentPoints: user.unspentLoyaltyPoints,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error uploading profile picture" },
      { status: 500 }
    );
  }
}
