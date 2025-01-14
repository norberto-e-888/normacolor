import { Loader } from "lucide-react";
import { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonProps } from "@/components/ui/button";

export const SubmitButton = ({
  text,
  pendingText = <Loader size="20px" className="animate-spin" />,
  disabled = false,
  disableOnPending = true,
  ...buttonProps
}: {
  text: string | ReactNode;
  pendingText?: string | ReactNode;
  disabled?: boolean;
  disableOnPending?: boolean;
} & ButtonProps) => {
  const status = useFormStatus();
  const isDisabled = (disableOnPending && status.pending) || disabled;

  return (
    <Button type="submit" disabled={isDisabled} {...buttonProps}>
      {status.pending ? pendingText : text}
    </Button>
  );
};
