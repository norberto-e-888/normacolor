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
