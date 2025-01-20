// components/ui/content.tsx
import { cn } from "@/lib/client";

type ContentProps = Readonly<{
  children?: React.ReactNode;
  center?: boolean;
  className?: string;
  padding?: boolean;
  title?: string;
}>;

export const Content = ({
  children,
  center = false,
  className,
  padding = true,
  title,
}: ContentProps) => (
  <div
    className={cn(
      // Base styles
      "w-full h-100vh flex flex-col",
      padding && "p-4",
      className
    )}
  >
    {/* Title section */}
    {title && (
      <div className="mb-6 flex-none">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    )}

    {/* Main content area */}
    <div
      className={cn(
        "flex-1 min-h-0", // Critical for proper scrolling
        center && "flex justify-center",
        "overflow-auto" // Enable scrolling by default
      )}
    >
      {children}
    </div>
  </div>
);
