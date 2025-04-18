import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { User } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";

// Schema for profile update
const profileUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phoneNumber: z.string().optional(),
});

// Points awarded for completing profile fields
const PROFILE_COMPLETION_POINTS = 1000;

// GET user profile information
export async function GET() {
  const session = (await getServerSession()) as ExtendedSession;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await User.findById(session.user.id).lean();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phoneNumber: user.phoneNumber || "",
    totalLoyaltyPoints: user.totalLoyaltyPoints,
    unspentLoyaltyPoints: user.unspentLoyaltyPoints,
    loyaltyTier: user.loyaltyTier,
    tierQualificationSpendCents: user.tierQualificationSpendCents,
    profilePicture: user.profilePicture,
    profileCompletionFlags: user.profileCompletionFlags || {
      nameAdded: false,
      phoneAdded: false,
      profilePictureAdded: false,
    },
  });
}

// PUT to update user profile
export async function PUT(request: NextRequest) {
  const session = (await getServerSession()) as ExtendedSession;

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Initialize points to award
    let pointsToAward = 0;
    const profileFlags = user.profileCompletionFlags || {
      nameAdded: false,
      phoneAdded: false,
      profilePictureAdded: false,
    };

    // Update firstName and lastName if provided
    if (validatedData.firstName !== undefined) {
      user.firstName = validatedData.firstName;
    }

    if (validatedData.lastName !== undefined) {
      user.lastName = validatedData.lastName;
    }

    // Award points for name if both first and last name are filled and we haven't given points yet
    if (user.firstName && user.lastName && !profileFlags.nameAdded) {
      pointsToAward += PROFILE_COMPLETION_POINTS;
      profileFlags.nameAdded = true;
    }

    // Update phoneNumber if provided
    if (validatedData.phoneNumber !== undefined) {
      user.phoneNumber = validatedData.phoneNumber;

      // Award points for phone number if it's now filled and we haven't given points yet
      if (validatedData.phoneNumber && !profileFlags.phoneAdded) {
        pointsToAward += PROFILE_COMPLETION_POINTS;
        profileFlags.phoneAdded = true;
      }
    }

    // Update profileCompletionFlags
    user.profileCompletionFlags = profileFlags;

    // Add points if any were awarded
    if (pointsToAward > 0) {
      user.totalLoyaltyPoints += pointsToAward;
      user.unspentLoyaltyPoints += pointsToAward;
    }

    await user.save();

    return NextResponse.json({
      success: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        totalLoyaltyPoints: user.totalLoyaltyPoints,
        unspentLoyaltyPoints: user.unspentLoyaltyPoints,
        profileCompletionFlags: user.profileCompletionFlags,
      },
      pointsAwarded: pointsToAward,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
