import { cn } from "@/lib/client";

export const Content = ({
  children,
  center = false,
  className,
}: Readonly<{
  children: React.ReactNode;
  center?: boolean;
  className?: string;
}>) => (
  <div className={cn("w-full p-4", center && "flex justify-center", className)}>
    {children}
  </div>
);
