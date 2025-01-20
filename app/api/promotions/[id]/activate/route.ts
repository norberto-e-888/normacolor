import { NextResponse } from "next/server";

import { Promotion, PromotionStatus } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const promotion = await Promotion.findById(params.id);

  if (!promotion) {
    return new NextResponse("Promotion not found", { status: 404 });
  }

  if (promotion.status !== PromotionStatus.Draft) {
    return new NextResponse("Only draft promotions can be activated", {
      status: 400,
    });
  }

  promotion.status = PromotionStatus.Active;
  await promotion.save();

  return NextResponse.json({ success: true });
}
