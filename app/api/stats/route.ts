import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { NextResponse } from "next/server";

import { Order, User, UserRole } from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export async function GET() {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== UserRole.Admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();

  // Get total users
  const totalUsers = await User.countDocuments({ role: UserRole.Client });

  // Get user signups per month for the last 6 months
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const signUpsAggregation = await User.aggregate([
    {
      $match: {
        role: UserRole.Client,
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Get monthly income for the last 6 months
  const incomeAggregation = await Order.aggregate([
    {
      $match: {
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
  const signUps = [];
  const income = [];
  let currentDate = sixMonthsAgo;

  for (let i = 0; i < 6; i++) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    // Find matching signup data
    const signUpData = signUpsAggregation.find(
      (data) => data._id.year === year && data._id.month === month
    );

    // Find matching income data
    const incomeData = incomeAggregation.find(
      (data) => data._id.year === year && data._id.month === month
    );

    signUps.push({
      date: endOfMonth(currentDate).toISOString(),
      value: signUpData?.count || 0,
    });

    income.push({
      date: endOfMonth(currentDate).toISOString(),
      value: incomeData?.total || 0,
    });

    currentDate = startOfMonth(subMonths(currentDate, -1));
  }

  // Calculate trends (percentage change from previous month)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current * 100;
    return ((current - previous) / previous) * 100;
  };

  const currentMonthSignUps = signUps[signUps.length - 1].value;
  const previousMonthSignUps = signUps[signUps.length - 2].value;
  const signUpsTrend = calculateTrend(
    currentMonthSignUps,
    previousMonthSignUps
  );

  const currentMonthIncome = income[income.length - 1].value;
  const previousMonthIncome = income[income.length - 2].value;
  const incomeTrend = calculateTrend(currentMonthIncome, previousMonthIncome);

  return NextResponse.json({
    totalUsers,
    signUps,
    income,
    signUpsTrend,
    incomeTrend,
  });
}
