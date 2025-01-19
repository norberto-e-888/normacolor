import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { NextResponse } from "next/server";

import { Order, Product, User } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();

  // Get user data including aggregations
  const user = await User.findById(session.user.id).lean();
  if (!user) {
    return new NextResponse("User not found", { status: 404 });
  }

  // Get monthly spending and LP for the last 6 months
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const spendingAggregation = await Order.aggregate([
    {
      $match: {
        customerId: user._id,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$total" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Transform aggregation results into time series data
  const spending = [];
  let currentDate = sixMonthsAgo;

  for (let i = 0; i < 6; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const spendingData = spendingAggregation.find(
      (data) => data._id.year === year && data._id.month === month
    );

    spending.push({
      date: endOfMonth(currentDate).toISOString(),
      value: spendingData?.total || 0,
    });

    currentDate = startOfMonth(subMonths(currentDate, -1));
  }

  // Get most popular product details if exists
  let popularProduct = null;
  if (user.aggregations?.mostOrderedProduct) {
    popularProduct = await Product.findById(
      user.aggregations.mostOrderedProduct
    ).lean();
  }

  // Get latest viewed order
  const latestOrder = await Order.findOne({
    customerId: user._id,
  })
    .sort({ updatedAt: -1 })
    .limit(1)
    .lean();

  return NextResponse.json({
    user: {
      ...user,
      id: user._id.toString(),
      _id: undefined,
    },
    spending,
    popularProduct: popularProduct
      ? {
          ...popularProduct,
          id: popularProduct._id.toString(),
          _id: undefined,
        }
      : null,
    latestOrder: latestOrder
      ? {
          ...latestOrder,
          id: latestOrder._id.toString(),
          _id: undefined,
        }
      : null,
  });
}
