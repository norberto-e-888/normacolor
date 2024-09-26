import mongoose, { Model } from "mongoose";
import { BaseModel, setUniqueMembers, getSchema, isEnumArray } from "./utils";

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
  role: UserRole;
  providers: UserProvider[];
  name?: string;
  image?: string;
}

export const USER_MODEL_NAME = "User";

const userSchema = getSchema<User>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
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
});

userSchema.index({
  role: 1,
});

export const User: Model<User> =
  mongoose.models.User || mongoose.model<User>(USER_MODEL_NAME, userSchema);
