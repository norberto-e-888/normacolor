import { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button, ButtonProps } from "../ui";

export const SubmitButton = ({
  pendingText,
  settledText,
  disabled = false,
  disableOnPending = true,
  buttonProps = {},
}: {
  pendingText: string | ReactNode;
  settledText: string | ReactNode;
  disabled?: boolean;
  disableOnPending?: boolean;
  buttonProps?: ButtonProps;
}) => {
  const status = useFormStatus();
  const isDisabled = (disableOnPending && status.pending) || disabled;

  return (
    <Button type="submit" disabled={isDisabled} {...buttonProps}>
      {status.pending ? pendingText : settledText}
    </Button>
  );
};
