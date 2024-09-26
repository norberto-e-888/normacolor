import mongoose, { Model } from "mongoose";
import { BaseModel } from "./utils";

export enum UserRole {
  Client = "cliente",
  Admin = "admin",
}

export interface User extends BaseModel {
  email: string;
  role: UserRole;
  name?: string;
  image?: string;
}

export const USER_MODEL_NAME = "User";

const userSchema = new mongoose.Schema<User>(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.Client,
    },
    name: {
      type: String,
      lowercase: true,
      trim: true,
    },
    image: {
      type: String,
    },
  },
  {
    id: true,
    timestamps: {
      createdAt: true,
      updatedAt: true,
    },
  }
);

userSchema.index({
  role: 1,
});

export const User: Model<User> =
  mongoose.models.User || mongoose.model(USER_MODEL_NAME, userSchema);
