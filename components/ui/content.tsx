// components/ui/content.tsx
import { cn } from "@/lib/client";

type ContentProps = Readonly<{
  children?: React.ReactNode;
  center?: boolean;
  className?: string;
  padding?: boolean;
  title?: string;
  scrollable?: boolean;
}>;

export const Content = ({
  children,
  center = false,
  className,
  padding = true,
  title,
  scrollable = false,
}: ContentProps) => (
  <div
    className={cn(
      // Base styles
      "w-full h-auto flex flex-col",
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
        "min-h-0", // Critical for proper scrolling
        center && "flex items-center justify-center",
        scrollable && "overflow-auto" // Enable scrolling by default
      )}
    >
      {children}
    </div>
  </div>
);
