import * as brcrypt from "bcryptjs";
import mongoose, { HydratedDocument, Model } from "mongoose";

import { BaseModel, getSchema, isEmail, ModelName } from "@/utils";

export interface OTP extends BaseModel {
  requestedBy: string;
  hash: string;
  isPasswordSetting: boolean;
  expires: Date;
}

const otpSchema = getSchema<OTP>({
  requestedBy: {
    type: String,
    required: true,
    validate: [isEmail()],
    unique: true,
  },
  hash: {
    type: String,
    required: true,
  },
  isPasswordSetting: {
    type: Boolean,
    default: false,
  },
  expires: {
    type: Date,
    set: () => new Date(Date.now() + 1000 * 60 * 5),
    default: () => new Date(Date.now() + 1000 * 60 * 5),
  },
});

type GenerateRandomCodeResult = {
  hash: string;
  code: string;
};

otpSchema.static(
  "generateRandomCode",
  async function generateRandomCode(): Promise<GenerateRandomCodeResult> {
    const code = new Array(6)
      .fill(0)
      .reduce((_code) => `${Math.floor(Math.random() * 10)}${_code}`, "");

    return {
      hash: await brcrypt.hash(code, 10),
      code,
    };
  }
);

export type CheckCodeData = {
  code: string;
  requestedBy: string;
};

otpSchema.method(
  "checkCode",
  function checkCode(this: OTP, code: string): Promise<boolean> {
    return brcrypt.compare(code, this.hash);
  }
);

otpSchema.method(
  "isExpired",
  function isExpired(this: HydratedDocument<OTP>): boolean {
    return this.expires.getTime() < Date.now();
  }
);

interface OTPMethods {
  isExpired(): boolean;
  checkCode(code: string): Promise<boolean>;
}

interface OTPModel extends Model<OTP, unknown, OTPMethods> {
  generateRandomCode(): Promise<GenerateRandomCodeResult>;
}

export const OTP =
  (mongoose.models.OTP as OTPModel) ||
  mongoose.model<OTP, OTPModel>(ModelName.OTP, otpSchema);
