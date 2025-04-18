import mongoose, { Model } from "mongoose";

import {
  BaseModel,
  getSchema,
  isEnumArray,
  ModelName,
  setUniqueMembers,
} from "@/utils";

export enum UserRole {
  Client = "client",
  Admin = "admin",
}

export enum UserProvider {
  Email = "resend",
  Google = "google",
  Twitter = "twitter",
  Instagram = "instagram",
}

export enum UserLoyaltyTier {
  Bronze = "bronze",
  Silver = "silver",
  Gold = "gold",
}

// Tier configuration with spending requirements and points multipliers
export const LOYALTY_TIER_CONFIG = {
  [UserLoyaltyTier.Bronze]: {
    pointsMultiplier: 1,
    spendingRequirement: 0, // Default tier, no requirement
  },
  [UserLoyaltyTier.Silver]: {
    pointsMultiplier: 2,
    spendingRequirement: 1000000, // $10,000 in cents
  },
  [UserLoyaltyTier.Gold]: {
    pointsMultiplier: 4,
    spendingRequirement: 5000000, // $50,000 in cents
  },
};

// Time window for qualifying spend (in months)
export const TIER_QUALIFICATION_PERIOD_MONTHS = 6;

export interface User extends BaseModel {
  email: string;
  password?: string;
  role: UserRole;
  providers: UserProvider[];
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  image?: string;
  profilePicture?: string;
  totalSpentCents: number;
  totalLoyaltyPoints: number;
  unspentLoyaltyPoints: number;
  loyaltyTier: UserLoyaltyTier;
  tierQualificationEndDate: Date;
  tierQualificationSpendCents: number;
  profileCompletionFlags: {
    nameAdded: boolean;
    phoneAdded: boolean;
    profilePictureAdded: boolean;
  };
  aggregations: {
    lastOrderDate?: Date;
    averageOrderValue: number;
    mostOrderedProduct?: string; // productId
    orderStatusCounts: Record<string, number>; // Maps status to count
    totalOrderItems: number;
    productOrderCounts: Record<string, number>;
    totalOrders: number;
  };
}

const userSchema = getSchema<User>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      required: true,
      enum: Object.values(UserRole),
      default: UserRole.Client,
    },
    providers: {
      type: [String],
      required: true,
      validate: [isEnumArray(UserProvider)],
      set: setUniqueMembers,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    totalSpentCents: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalLoyaltyPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    unspentLoyaltyPoints: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    loyaltyTier: {
      type: String,
      required: true,
      enum: Object.values(UserLoyaltyTier),
      default: UserLoyaltyTier.Bronze,
    },
    tierQualificationEndDate: {
      type: Date,
      required: true,
      default: () => {
        const date = new Date();
        date.setMonth(date.getMonth() + TIER_QUALIFICATION_PERIOD_MONTHS);
        return date;
      },
    },
    tierQualificationSpendCents: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    profileCompletionFlags: {
      type: new mongoose.Schema(
        {
          nameAdded: {
            type: Boolean,
            default: false,
          },
          phoneAdded: {
            type: Boolean,
            default: false,
          },
          profilePictureAdded: {
            type: Boolean,
            default: false,
          },
        },
        { _id: false }
      ),
      required: true,
      default: () => ({}),
    },
    aggregations: {
      type: new mongoose.Schema(
        {
          lastOrderDate: {
            type: Date,
          },
          averageOrderValue: {
            type: Number,
            default: 0,
          },
          mostOrderedProduct: {
            type: String,
          },
          orderStatusCounts: {
            type: Object,
            default: {},
          },
          totalOrderItems: {
            type: Number,
            default: 0,
          },
          productOrderCounts: {
            type: Object,
            default: {},
          },
          totalOrders: {
            type: Number,
            default: 0,
          },
        },
        { _id: false }
      ),
      required: true,
      default: () => ({}),
    },
  },
  {
    omitFromTransform: ["password"],
  }
);

userSchema.index({
  role: 1,
});

userSchema.index({
  loyaltyTier: 1,
});

// Helper function to determine tier based on spending
export function determineUserTier(spendingCents: number): UserLoyaltyTier {
  if (
    spendingCents >=
    LOYALTY_TIER_CONFIG[UserLoyaltyTier.Gold].spendingRequirement
  ) {
    return UserLoyaltyTier.Gold;
  } else if (
    spendingCents >=
    LOYALTY_TIER_CONFIG[UserLoyaltyTier.Silver].spendingRequirement
  ) {
    return UserLoyaltyTier.Silver;
  } else {
    return UserLoyaltyTier.Bronze;
  }
}

// Helper function to calculate loyalty points based on tier
export function calculateLoyaltyPoints(
  amountCents: number,
  tier: UserLoyaltyTier
): number {
  // Convert cents to dollars (1% of dollars spent) before applying multiplier
  const amountDollars = amountCents / 100;
  return Math.round(amountDollars * LOYALTY_TIER_CONFIG[tier].pointsMultiplier);
}

export const User: Model<User> =
  mongoose.models?.User || mongoose.model<User>(ModelName.User, userSchema);

export async function createOrderFrequencyView() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not available");
  }

  // Drop existing view if it exists
  try {
    await db.dropCollection("order_frequencies");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Ignore if collection doesn't exist
  }

  await db.createCollection("order_frequencies", {
    viewOn: "orders",
    pipeline: [
      {
        $group: {
          _id: "$customerId",
          daily: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    {
                      $dateFromParts: {
                        year: { $year: "$$NOW" },
                        month: { $month: "$$NOW" },
                        day: { $dayOfMonth: "$$NOW" },
                      },
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          weekly: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    {
                      $dateSubtract: {
                        startDate: "$$NOW",
                        unit: "day",
                        amount: { $dayOfWeek: "$$NOW" },
                      },
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          monthly: {
            $sum: {
              $cond: [
                {
                  $gte: [
                    "$createdAt",
                    {
                      $dateFromParts: {
                        year: { $year: "$$NOW" },
                        month: { $month: "$$NOW" },
                        day: 1,
                      },
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ],
  });
}
