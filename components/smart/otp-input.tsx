"use client";

import React, {
  ClipboardEvent,
  KeyboardEvent,
  MouseEvent,
  useRef,
  useState,
} from "react";

export const OTPInput = ({
  defaultOTP = "      ",
  onChange,
}: {
  defaultOTP?: string;
  onChange?: (otp: string) => void;
}) => {
  const [otp, setOtp] = useState<string[]>(defaultOTP.split("").slice(0, 6));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const findFirstEmptyIndex = () => {
    return otp.findIndex((digit) => digit === "");
  };

  const findLastFilledIndex = () => {
    return otp.findLastIndex((val) => !!val);
  };

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) {
      return;
    }

    const firstEmptyIndex = findFirstEmptyIndex();
    if (index > firstEmptyIndex && firstEmptyIndex !== -1) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (onChange) {
      onChange(newOtp.join(""));
    }

    if (value !== "") {
      focusInput(Math.min(index + 1, 5));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const lastFilledIndex = findLastFilledIndex();
      index = lastFilledIndex === index ? index : lastFilledIndex;
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);

      if (onChange) {
        onChange(newOtp.join(""));
      }

      const ref = inputRefs.current[Math.max(index - 1, 0)];

      if (ref) {
        ref.disabled = false;
      }

      focusInput(Math.max(index - 1, 0));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusInput(Math.max(index - 1, 0));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusInput(Math.min(index + 1, 5));
    } else if (
      !Number.isNaN(Number(e.key)) &&
      otp[index] &&
      otp.filter(Boolean).length < 6
    ) {
      const newOtp = [...otp];
      const lastFilledIndex = findLastFilledIndex();
      newOtp[lastFilledIndex + 1] = e.key;
      focusInput(lastFilledIndex + 1);
      setOtp(newOtp);

      if (onChange) {
        onChange(newOtp.join(""));
      }
    }
  };

  const handleClick = (
    index: number,
    e: MouseEvent<HTMLInputElement, globalThis.MouseEvent>
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const firstEmptyIndex = findFirstEmptyIndex();
    if (index > firstEmptyIndex) {
      focusInput(firstEmptyIndex);
    }

    const lastFilledIndex = findLastFilledIndex();

    if (index < lastFilledIndex) {
      focusInput(lastFilledIndex === 5 ? 5 : lastFilledIndex + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6).split("");
    const newOtp = [...otp];
    let lastFilledIndex = -1;
    pastedData.forEach((value, index) => {
      if (index < 6 && !isNaN(Number(value))) {
        newOtp[index] = value;
        lastFilledIndex = index;
      }
    });

    setOtp(newOtp);
    focusInput(Math.min(lastFilledIndex + 1, 5));
  };

  return (
    <div className="flex space-x-2">
      {otp.map((digit, index) => (
        <input
          key={index}
          name="code"
          type="text"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onClick={(e) => handleClick(index, e)}
          onPaste={handlePaste}
          disabled={
            !(
              index === findLastFilledIndex() || index === findFirstEmptyIndex()
            )
          }
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          className="w-12 h-12 text-center text-2xl border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none transition-colors"
          aria-label={`Digit ${index + 1} of OTP`}
          autoComplete="off"
        />
      ))}
    </div>
  );
};
