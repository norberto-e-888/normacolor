import { cn } from "@/lib/client";

type ContainerProps = Readonly<{
  children: React.ReactNode;
  className?: string;
  direction?: "row" | "col";
}>;

export const Container = ({
  children,
  className,
  direction = "col",
}: ContainerProps) => (
  <div
    className={cn(
      "min-h-screen w-full",
      direction === "col" ? "flex flex-col" : "flex",
      className
    )}
  >
    {children}
  </div>
);
