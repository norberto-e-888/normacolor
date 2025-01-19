import mongoose, { Model } from "mongoose";

import { BaseModel, getSchema, ModelName } from "@/utils";

export enum PromotionType {
  PointsDiscount = "points_discount", // Spend X points to get Y% off
  PointsProduct = "points_product", // Spend X points to get product for free
  PointsChallenge = "points_challenge", // Complete challenge to earn bonus points
  LimitedTimeOffer = "limited_time_offer", // Special time-limited promotions
  TierUnlock = "tier_unlock", // Unlock special perks at point thresholds
  Streak = "streak", // Rewards for consistent ordering
  Seasonal = "seasonal", // Holiday/seasonal special offers
  Referral = "referral", // Points for referring new customers
}

export enum PromotionStatus {
  Draft = "draft",
  Active = "active",
  Paused = "paused",
  Ended = "ended",
}

export enum PromotionTrigger {
  Manual = "manual", // User manually activates
  Automatic = "automatic", // Activates when conditions met
  Scheduled = "scheduled", // Activates at specific times
}

export type PromotionCondition = {
  type:
    | "min_order_value"
    | "min_order_count"
    | "specific_products"
    | "order_streak";
  value: number | string[];
};

export type PromotionReward = {
  type:
    | "discount_percentage"
    | "bonus_points"
    | "free_product"
    | "tier_upgrade";
  value: number | string; // Percentage, points, productId, or tier level
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
          enum: [
            "min_order_value",
            "min_order_count",
            "specific_products",
            "order_streak",
          ],
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
          enum: [
            "discount_percentage",
            "bonus_points",
            "free_product",
            "tier_upgrade",
          ],
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
