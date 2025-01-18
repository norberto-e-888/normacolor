import { NextResponse } from "next/server";

import { User, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function DELETE(
  _: Request,
  { params }: { params: { clientId: string } }
) {
  const session = (await getServerSession()) as ExtendedSession;
  if (
    !session ||
    session.user.role !== UserRole.Admin ||
    session.user.email !== process.env.ROOT_USER_EMAIL
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const client = await User.findOneAndDelete({
    _id: params.clientId,
    role: UserRole.Client,
  });

  if (!client) {
    return new NextResponse("Client not found", { status: 404 });
  }

  return NextResponse.json({ success: true });
}
