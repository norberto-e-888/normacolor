import { NextResponse } from "next/server";

import { User } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const user = await User.findById(session.user.id);
  if (!user) {
    return new NextResponse(null);
  }

  return NextResponse.json(user.toObject());
}
