import { useFormStatus } from "react-dom";
import { Button } from "../ui";

export const SubmitButton = ({
  disabled = false,
  disableOnPending = true,
  settledText,
  pendingText,
}: {
  disabled?: boolean;
  disableOnPending?: boolean;
  settledText: string;
  pendingText: string;
}) => {
  const status = useFormStatus();
  const isDisabled = (disableOnPending && status.pending) || disabled;

  return (
    <Button type="submit" disabled={isDisabled} className="w-full">
      {status.pending ? pendingText : settledText}
    </Button>
  );
};
