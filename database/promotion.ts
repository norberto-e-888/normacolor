import mongoose, { Model } from "mongoose";
import { z } from "zod";

import { BaseModel, getSchema, ModelName } from "@/utils";

export enum PromotionType {
  PointsDiscount = "points_discount",
  PointsProduct = "points_product",
  PointsChallenge = "points_challenge",
  LimitedTimeOffer = "limited_time_offer",
  TierUnlock = "tier_unlock",
  Streak = "streak",
  Seasonal = "seasonal",
  Referral = "referral",
}

export enum PromotionStatus {
  Draft = "draft",
  Active = "active",
  Paused = "paused",
  Ended = "ended",
}

export enum PromotionTrigger {
  Manual = "manual",
  Automatic = "automatic",
  Scheduled = "scheduled",
}

export enum PromotionConditionType {
  MinOrderValue = "min_order_value",
  MinOrderCount = "min_order_count",
  SpecificProducts = "specific_products",
  OrderStreak = "order_streak",
}

export enum PromotionRewardType {
  DiscountPercentage = "discount_percentage",
  BonusPoints = "bonus_points",
  FreeProduct = "free_product",
  TierUpgrade = "tier_upgrade",
}

export type PromotionCondition = {
  type: PromotionConditionType;
  value: number | string[];
};

export type PromotionReward = {
  type: PromotionRewardType;
  value: number | string;
};

export type Promotion = {
  name: string;
  description: string;
  type: PromotionType;
  status: PromotionStatus;
  trigger: PromotionTrigger;
  startDate?: Date;
  endDate?: Date;
  pointsCost: number;
  conditions: PromotionCondition[];
  rewards: PromotionReward[];
  maxRedemptions?: number;
  currentRedemptions: number;
  metadata: {
    displayImage?: string;
    highlightColor?: string;
    badgeIcon?: string;
    priority?: number;
    tags?: string[];
  };
} & BaseModel;

const promotionSchema = getSchema<Promotion>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(PromotionType),
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(PromotionStatus),
    default: PromotionStatus.Draft,
  },
  trigger: {
    type: String,
    required: true,
    enum: Object.values(PromotionTrigger),
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  pointsCost: {
    type: Number,
    required: true,
    min: 0,
  },
  conditions: {
    type: [
      {
        type: {
          type: String,
          required: true,
          enum: Object.values(PromotionConditionType),
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    default: [],
  },
  rewards: {
    type: [
      {
        type: {
          type: String,
          required: true,
          enum: Object.values(PromotionRewardType),
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    required: true,
    validate: [
      {
        validator: (rewards: PromotionReward[]) => rewards.length > 0,
        message: "At least one reward is required",
      },
    ],
  },
  maxRedemptions: {
    type: Number,
    min: 1,
  },
  currentRedemptions: {
    type: Number,
    required: true,
    default: 0,
  },
  metadata: {
    type: new mongoose.Schema(
      {
        displayImage: String,
        highlightColor: String,
        badgeIcon: String,
        priority: Number,
        tags: [String],
      },
      { _id: false }
    ),
    required: true,
    default: {},
  },
});

promotionSchema.index({ status: 1 });
promotionSchema.index({ type: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

export const Promotion: Model<Promotion> =
  mongoose.models?.Promotion ||
  mongoose.model(ModelName.Promotion, promotionSchema);

export const VALID_TYPE_CONDITION_COMBINATIONS: Record<
  PromotionType,
  PromotionConditionType[]
> = {
  [PromotionType.PointsDiscount]: [PromotionConditionType.MinOrderValue],
  [PromotionType.PointsProduct]: [PromotionConditionType.SpecificProducts],
  [PromotionType.PointsChallenge]: [
    PromotionConditionType.MinOrderCount,
    PromotionConditionType.OrderStreak,
  ],
  [PromotionType.LimitedTimeOffer]: [
    PromotionConditionType.MinOrderValue,
    PromotionConditionType.SpecificProducts,
  ],
  [PromotionType.TierUnlock]: [
    PromotionConditionType.MinOrderValue,
    PromotionConditionType.MinOrderCount,
  ],
  [PromotionType.Streak]: [PromotionConditionType.OrderStreak],
  [PromotionType.Seasonal]: [
    PromotionConditionType.MinOrderValue,
    PromotionConditionType.SpecificProducts,
  ],
  [PromotionType.Referral]: [PromotionConditionType.MinOrderCount],
};

export const VALID_TYPE_REWARD_COMBINATIONS: Record<
  PromotionType,
  PromotionRewardType[]
> = {
  [PromotionType.PointsDiscount]: [PromotionRewardType.DiscountPercentage],
  [PromotionType.PointsProduct]: [PromotionRewardType.FreeProduct],
  [PromotionType.PointsChallenge]: [PromotionRewardType.BonusPoints],
  [PromotionType.LimitedTimeOffer]: [
    PromotionRewardType.DiscountPercentage,
    PromotionRewardType.FreeProduct,
  ],
  [PromotionType.TierUnlock]: [PromotionRewardType.TierUpgrade],
  [PromotionType.Streak]: [
    PromotionRewardType.BonusPoints,
    PromotionRewardType.DiscountPercentage,
  ],
  [PromotionType.Seasonal]: [
    PromotionRewardType.DiscountPercentage,
    PromotionRewardType.FreeProduct,
  ],
  [PromotionType.Referral]: [PromotionRewardType.BonusPoints],
};

export const basePromotionSchema = z.object({
  id: z.string(),
  name: z.string().min(3),
  description: z.string().min(10),
  type: z.nativeEnum(PromotionType),
  status: z.nativeEnum(PromotionStatus),
  trigger: z.nativeEnum(PromotionTrigger),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  pointsCost: z.number().min(0),
  maxRedemptions: z.number().min(1).optional(),
  conditions: z.array(
    z.object({
      type: z.nativeEnum(PromotionConditionType),
      value: z.union([z.number(), z.array(z.string())]),
    })
  ),
  rewards: z
    .array(
      z.object({
        type: z.nativeEnum(PromotionRewardType),
        value: z.union([z.number(), z.string()]),
      })
    )
    .min(1),
  metadata: z.object({
    highlightColor: z.string().optional(),
    priority: z.number().min(0).max(100).optional(),
    tags: z.array(z.string()).optional(),
  }),
});
