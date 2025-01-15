import { NextResponse } from "next/server";

import { Order, OrderStatus, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

const PAGE_SIZE = 10;

export async function GET(request: Request) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== UserRole.Admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const selectedId = searchParams.get("selectedId");
  const status = searchParams.get("status") as OrderStatus | null;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  await connectToMongo();

  const query = {
    ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {}),
    ...(status ? { status } : {}),
  };

  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const orders = await Order.find(query)
    .sort(sort)
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
    selectedOrder = await Order.findById(selectedId)
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

export type OrdersAdminResponse = {
  orders: Order<true>[];
  nextCursor: string | null;
  selectedOrder: Order<true> | null;
};
