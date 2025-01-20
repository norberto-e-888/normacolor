// components/ui/upload.tsx
import { Loader, UploadIcon } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/client";

export interface UploadProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const Upload = forwardRef<HTMLInputElement, UploadProps>(
  (
    {
      className,
      icon = <UploadIcon className="w-4 h-4" />,
      isLoading,
      ...props
    },
    ref
  ) => {
    return (
      <>
        {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : icon}
        <input
          type="file"
          className={cn(
            "file:mr-4 file:py-2 file:px-4",
            "file:rounded-full file:border-0",
            "file:text-sm file:font-semibold",
            "file:bg-primary file:text-primary-foreground",
            "hover:file:bg-primary/90",
            "hidden",
            className
          )}
          ref={ref}
          {...props}
        />
      </>
    );
  }
);

Upload.displayName = "Upload";

export { Upload };
