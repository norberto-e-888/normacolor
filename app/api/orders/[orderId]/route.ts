import { NextResponse } from "next/server";

import { Order, User } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function GET(
  _: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const order = await Order.findById(params.orderId);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  if (order.customerId.toString() !== session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Fetch the user to get their loyalty tier
  const user = await User.findById(session.user.id);
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  const cart = order.cart.map((item) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(item as any).toObject(),
    id: item._id.toString(),
    _id: undefined,
  }));

  return NextResponse.json({
    order: {
      ...order.toObject(),
      cart,
      customerTier: user.loyaltyTier, // Add the user's loyalty tier
    },
  });
}
