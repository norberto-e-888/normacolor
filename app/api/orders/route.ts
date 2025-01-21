import { NextResponse } from "next/server";

import { Order, OrderStatus } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { z } from "zod";

const PAGE_SIZE = 10;

const ACTIVE_STATUSES = [
  OrderStatus.Paid,
  OrderStatus.InProgress,
  OrderStatus.ReadyToPickUp,
  OrderStatus.EnRoute,
];

export const OrderGroup = z.enum(["active"]);
export type OrderGroup = z.infer<typeof OrderGroup>;

const GROUP_STATUSES: {
  [key in OrderGroup]: OrderStatus[];
} = {
  active: ACTIVE_STATUSES,
};

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const selectedId = searchParams.get("selectedId");
  const group = await OrderGroup.safeParseAsync(searchParams.get("group"));

  await connectToMongo();

  const query: {
    customerId: string;
    createdAt?: { $lt: Date };
    status?: { $in: OrderStatus[] };
  } = {
    customerId: session.user.id,
    ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {}),
  };

  if (group.success) {
    query.status = { $in: GROUP_STATUSES[group.data] };
  }

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE + 1)
    .then((docs) =>
      docs.map((doc) => ({
        ...doc.toObject(),
        id: doc._id.toString(),
        _id: undefined,
        cart: doc.cart.map((item) => ({
          ...item.toObject(),
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
    }).then((doc) =>
      doc
        ? {
            ...doc.toObject(),
            id: doc._id.toString(),
            _id: undefined,
            cart: doc.cart.map((item) => ({
              ...item.toObject(),
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
