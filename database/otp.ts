import * as brcrypt from "bcryptjs";
import mongoose, { HydratedDocument, Model } from "mongoose";

import { BaseModel, getSchema, isEmail, ModelName } from "@/utils";

export type OTP = {
  requestedBy: string;
  hash: string;
  isPasswordSetting: boolean;
  expires: Date;
} & BaseModel;

export type GenerateRandomCodeResult = {
  hash: string;
  code: string;
};

export type CheckCodeData = {
  code: string;
  requestedBy: string;
};

export type OTPModel = Model<
  OTP,
  unknown,
  {
    isExpired(): boolean;
    checkCode(code: string): Promise<boolean>;
  }
> & {
  generateRandomCode(): Promise<GenerateRandomCodeResult>;
};

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

export const OTP: OTPModel =
  (mongoose.models?.OTP as OTPModel) ||
  mongoose.model(ModelName.OTP, otpSchema);
