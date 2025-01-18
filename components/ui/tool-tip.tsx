"use client";

type Position = "top" | "bottom" | "left" | "right";

export function Tooltip({
  children,
  text,
  position = "top",
  show = true,
  className = "",
}: {
  children: React.ReactNode;
  text: string;
  position?: Position;
  show?: boolean;
  className?: string;
}) {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-y-2",
    bottom: "top-full left-1/2 translate-y-2",
    left: "right-full top-1/2 -translate-y-1/2 -translate-x-2",
    right: "left-full top-1/2 -translate-y-1/2 translate-x-2",
  };

  const arrowPositionClasses = {
    top: "left-1/2 top-full -translate-x-1/2 -translate-y-1 border-t-black",
    bottom:
      "left-1/2 bottom-full -translate-x-1/2 translate-y-1 border-b-black",
    left: "top-1/2 left-full -translate-y-1/2 -translate-x-1 border-l-black",
    right: "top-1/2 right-full -translate-y-1/2 translate-x-1 border-r-black",
  };

  if (!show) {
    return children;
  }

  return (
    <div className={`relative inline-block group/tooltip ${className}`}>
      {children}
      <div
        className={`pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity absolute ${positionClasses[position]} bg-black text-white text-xs rounded px-2 py-1 w-max whitespace-pre z-50`}
      >
        {text}
        <div
          className={`absolute border-4 border-transparent ${arrowPositionClasses[position]}`}
        />
      </div>
    </div>
  );
}
