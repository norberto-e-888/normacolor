import { cn } from "@/lib/client";

type ContentProps = Readonly<{
  children: React.ReactNode;
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
      "w-full h-[calc(100vh-4rem)] overflow-hidden",
      padding && "p-4",
      center && "flex justify-center",
      className
    )}
  >
    {title && (
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    )}
    {children}
  </div>
);
