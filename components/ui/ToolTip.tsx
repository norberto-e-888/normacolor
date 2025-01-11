"use client";

export function Tooltip({
  children,
  text,
  className = "",
}: {
  children: React.ReactNode;
  text: string;
  className?: string;
}) {
  return (
    <div className={`relative group/tooltip ${className}`}>
      {children}
      <div className="absolute left-1/2 -top-2 -translate-x-1/2 -translate-y-full invisible group-hover/tooltip:visible bg-black text-white text-xs rounded px-2 py-1 w-max whitespace-pre">
        {text}
      </div>
    </div>
  );
}
