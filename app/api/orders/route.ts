import { NextResponse } from "next/server";

import { Order } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const selectedId = searchParams.get("selectedId");

  await connectToMongo();

  const query = {
    customerId: session.user.id,
    ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {}),
  };

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE + 1)
    .lean()
    .then((docs) =>
      docs.map((doc) => ({
        ...doc,
        id: doc._id.toString(),
        _id: undefined,
        cart: doc.cart.map((item) => ({
          ...item,
          id: item._id.toString(),
          _id: undefined,
        })),
      }))
    );

  const hasMore = orders.length > PAGE_SIZE;
  if (hasMore) {
    orders.pop();
  }

  const nextCursor = hasMore
    ? orders[orders.length - 1].createdAt.toISOString()
    : null;

  let selectedOrder = null;
  if (selectedId) {
    selectedOrder = await Order.findOne({
      _id: selectedId,
      customerId: session.user.id,
    })
      .lean()
      .then((doc) =>
        doc
          ? {
              ...doc,
              id: doc._id.toString(),
              _id: undefined,
              cart: doc.cart.map((item) => ({
                ...item,
                id: item._id.toString(),
                _id: undefined,
              })),
            }
          : null
      );
  }

  return NextResponse.json({
    orders,
    nextCursor,
    selectedOrder,
  });
}
