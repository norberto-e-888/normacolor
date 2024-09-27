import { useFormStatus } from "react-dom";

export function SignInButton({
  isLoadingSession,
}: {
  isLoadingSession: boolean;
}) {
  const status = useFormStatus();

  return (
    <button
      type="submit"
      className="border-2 border-cyan-600"
      disabled={status.pending || isLoadingSession}
    >
      {status.pending ? "Enviando..." : "Ingresa"}
    </button>
  );
}
