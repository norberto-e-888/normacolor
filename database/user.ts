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

export interface User extends BaseModel {
  email: string;
  password?: string;
  role: UserRole;
  providers: UserProvider[];
  name?: string;
  image?: string;
  totalSpentCents: number;
  totalLoyaltyPoints: number;
  unspentLoyaltyPoints: number;
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
    name: {
      type: String,
      lowercase: true,
      trim: true,
    },
    image: {
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

  // Create indexes for better query performance
  await db.collection("order_frequencies").createIndex({ _id: 1 });
}
