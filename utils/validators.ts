import { SchemaValidator } from "mongoose";

type Validator = SchemaValidator<unknown, unknown>;

const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const isEnumArray = (
  enumType: Record<string, string>,
  message = "Invalid enum array."
): Validator => ({
  validator: (value: string[]) =>
    value.every((s) => Object.values(enumType).includes(s)),
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

export const isEmail = (): Validator => ({
  validator: (value: string) => validEmailRegex.test(value),
  message: "Must be an email.",
});
