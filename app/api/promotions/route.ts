import { NextResponse } from "next/server";

import {
  basePromotionSchema,
  Promotion,
  PromotionStatus,
  VALID_TYPE_CONDITION_COMBINATIONS,
  VALID_TYPE_REWARD_COMBINATIONS,
} from "@/database";
import { ExtendedSession, getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

export const promotionSchema = basePromotionSchema
  .refine(
    (data) => {
      // Validate that all conditions are valid for the promotion type
      const validConditionTypes = VALID_TYPE_CONDITION_COMBINATIONS[data.type];
      return data.conditions.every((condition) =>
        validConditionTypes.includes(condition.type)
      );
    },
    {
      message: "Invalid condition type for this promotion type",
      path: ["conditions"],
    }
  )
  .refine(
    (data) => {
      // Validate that all rewards are valid for the promotion type
      const validRewardTypes = VALID_TYPE_REWARD_COMBINATIONS[data.type];
      return data.rewards.every((reward) =>
        validRewardTypes.includes(reward.type)
      );
    },
    {
      message: "Invalid reward type for this promotion type",
      path: ["rewards"],
    }
  )
  .refine(
    (data) => {
      // Validate reward values based on their type
      return data.rewards.every((reward) => {
        switch (reward.type) {
          case "discount_percentage":
            return (
              typeof reward.value === "number" &&
              reward.value > 0 &&
              reward.value <= 100
            );
          case "bonus_points":
            return typeof reward.value === "number" && reward.value > 0;
          case "free_product":
            return typeof reward.value === "string" && reward.value.length > 0;
          case "tier_upgrade":
            return (
              typeof reward.value === "string" &&
              ["silver", "gold", "platinum"].includes(reward.value)
            );
          default:
            return false;
        }
      });
    },
    {
      message: "Invalid reward value for the specified reward type",
      path: ["rewards"],
    }
  )
  .refine(
    (data) => {
      // Validate condition values based on their type
      return data.conditions.every((condition) => {
        switch (condition.type) {
          case "min_order_value":
          case "min_order_count":
          case "order_streak":
            return typeof condition.value === "number" && condition.value > 0;
          case "specific_products":
            return (
              Array.isArray(condition.value) &&
              condition.value.every(
                (id) => typeof id === "string" && id.length > 0
              )
            );
          default:
            return false;
        }
      });
    },
    {
      message: "Invalid condition value for the specified condition type",
      path: ["conditions"],
    }
  )
  .refine(
    (data) => {
      // Validate dates if both are provided
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as PromotionStatus | null;

  await connectToMongo();

  const query = status ? { status } : {};
  const promotions = await Promotion.find(query)
    .sort({ "metadata.priority": -1, createdAt: -1 })
    .lean()
    .then((docs) =>
      docs.map((doc) => ({
        ...doc,
        id: doc._id.toString(),
        _id: undefined,
      }))
    );

  return NextResponse.json(promotions);
}

export async function POST(request: Request) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const validation = await promotionSchema.safeParseAsync(json);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  await connectToMongo();
  const promotion = await Promotion.create({
    ...validation.data,
    currentRedemptions: 0,
  });

  return NextResponse.json({
    promotion: {
      ...promotion.toObject(),
      id: promotion._id.toString(),
      _id: undefined,
    },
  });
}

export async function PATCH(request: Request) {
  const session = (await getServerSession()) as ExtendedSession;
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const validation = await promotionSchema.safeParseAsync(json);

  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: validation.error.flatten() },
      { status: 400 }
    );
  }

  const { id, ...data } = validation.data;
  if (!id) {
    return new NextResponse("Promotion ID is required", { status: 400 });
  }

  await connectToMongo();
  const promotion = await Promotion.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  );

  if (!promotion) {
    return new NextResponse("Promotion not found", { status: 404 });
  }

  return NextResponse.json({
    promotion: {
      ...promotion.toObject(),
      id: promotion._id.toString(),
      _id: undefined,
    },
  });
}
