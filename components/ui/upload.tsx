// components/ui/upload.tsx
import { UploadIcon } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/client";

export interface UploadProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Upload = forwardRef<HTMLInputElement, UploadProps>(
  ({ className, icon = <UploadIcon className="w-4 h-4" />, ...props }, ref) => {
    return (
      <>
        {icon}
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
