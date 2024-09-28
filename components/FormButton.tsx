import { useFormStatus } from "react-dom";

export function FormButton({
  disabled = false,
  disableOnPending = true,
  settledText,
  pendingText,
}: {
  disabled?: boolean;
  disableOnPending?: boolean;
  settledText: string;
  pendingText: string;
}) {
  const status = useFormStatus();
  const isDisabled = (disableOnPending && status.pending) || disabled;

  return (
    <button type="submit" disabled={isDisabled}>
      {status.pending ? pendingText : settledText}
    </button>
  );
}
