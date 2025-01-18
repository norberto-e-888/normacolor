import { NextResponse } from "next/server";

import { Order, OrderStatus, User } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { orderId, paypalOrderId } = await request.json();

  await connectToMongo();
  const order = await Order.findById(orderId);

  if (!order) {
    return new NextResponse("Order not found", { status: 404 });
  }

  if (order.customerId.toString() !== session.user.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const response = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
        ).toString("base64")}`,
      },
    }
  );

  const data = await response.json();

  if (data.status === "COMPLETED") {
    await Order.findByIdAndUpdate(orderId, {
      status: OrderStatus.Paid,
    });

    // Update user's loyalty points
    // 1 point per cent spent
    const pointsEarned = order.total;
    await User.findByIdAndUpdate(session.user.id, {
      $inc: {
        totalSpentCents: order.total,
        totalLoyaltyPoints: pointsEarned,
        unspentLoyaltyPoints: pointsEarned,
      },
    });
  }

  return NextResponse.json({ success: true, orderId });
}
