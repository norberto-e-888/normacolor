import mongoose, { Model } from "mongoose";
import { BaseModel, getSchema } from "./utils";

export enum UserRole {
  Client = "client",
  Admin = "admin",
}

export interface User extends BaseModel {
  email: string;
  role: UserRole;
  name?: string;
  image?: string;
  test: String;
}

export const USER_MODEL_NAME = "User";

const userSchema = getSchema<User>({
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
});

userSchema.index({
  role: 1,
});

export const User: Model<User> =
  mongoose.models.User || mongoose.model<User>(USER_MODEL_NAME, userSchema);
