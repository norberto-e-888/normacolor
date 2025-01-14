import { cn } from "@/lib/client";

type ContentProps = Readonly<{
  children: React.ReactNode;
  center?: boolean;
  className?: string;
  fullHeight?: boolean;
  padding?: boolean;
  flex?: boolean;
}>;

export const Content = ({
  children,
  center = false,
  className,
  fullHeight = true,
  padding = true,
  flex = false,
}: ContentProps) => (
  <div
    className={cn(
      "w-full",
      center && "flex justify-center",
      fullHeight && "h-full",
      padding && "p-4",
      flex && "flex",
      className
    )}
  >
    {children}
  </div>
);
