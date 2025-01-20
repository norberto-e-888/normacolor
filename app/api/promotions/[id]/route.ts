import { NextResponse } from "next/server";

import { Promotion } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const promotion = await Promotion.findById(params.id);

  if (!promotion) {
    return new NextResponse("Promotion not found", { status: 404 });
  }

  if (promotion.status !== "draft") {
    return new NextResponse("Only draft promotions can be deleted", {
      status: 400,
    });
  }

  await promotion.deleteOne();
  return NextResponse.json({ success: true });
}
