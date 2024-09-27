import { SchemaValidator } from "mongoose";

type Validator = SchemaValidator<unknown, unknown>;

export const isEnumArray = (
  enumType: Record<string, string>,
  message = "Invalid enum array."
): Validator => ({
  validator: (v: string[]) =>
    v.every((s) => Object.values(enumType).includes(s)),
  message,
});

export const isArrayMinLength = (
  min: number,
  message = "Array does not meet minimum length"
): Validator => ({
  validator: (value: unknown[]) => value.length >= min,
  message,
});

export const isArrayMaxLength = (
  max: number,
  message = "Array exceeds maximum length"
): Validator => ({
  validator: (value: unknown[]) => value.length < max,
  message,
});
