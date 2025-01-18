import { cn } from "@/lib/client";

type ContentProps = Readonly<{
  children: React.ReactNode;
  center?: boolean;
  className?: string;
  fullHeight?: boolean;
  padding?: boolean;
  flex?: boolean;
  title?: string;
}>;

export const Content = ({
  children,
  center = false,
  className,
  fullHeight = true,
  padding = true,
  flex = false,
  title,
}: ContentProps) => (
  <div
    className={cn(
      "w-full",
      center && "flex justify-center",
      fullHeight && "h-full",
      padding && "p-4",
      flex && "flex",
      "flex flex-col",
      className
    )}
  >
    {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}
    {children}
  </div>
);
