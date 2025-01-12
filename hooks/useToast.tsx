"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useRef } from "react";
import { toast } from "sonner";

import { ToastType } from "@/utils/get-toast-url-config";

type ToastConfig = {
  title: string;
  description: string | ((data: Record<string, string>) => string);
  type?: "success" | "error" | "warning" | "info";
};

type ToastContextType = {
  showToast: (type: string, data?: Record<string, string>) => void;
};

const TOAST_MESSAGES: Record<ToastType, ToastConfig> = {
  [ToastType.OrderNotFound]: {
    title: "Orden no encontrada",
    description: "La orden que buscas no existe o fue eliminada.",
    type: "error",
  },
  [ToastType.Unauthorized]: {
    title: "Acceso denegado",
    description: "No tienes permiso para acceder a esta orden.",
    type: "error",
  },
  [ToastType.InvalidOrderStatus]: {
    title: "Estado inválido",
    description: (data) =>
      `La orden debe estar en estado "Esperando pago", pero está en estado "${data.orderStatus}".`,
    type: "error",
  },
  [ToastType.PaymentSuccess]: {
    title: "Pago exitoso",
    description: "Tu pago fue procesado con éxito.",
    type: "success",
  },
};

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shownToasts = useRef(new Set<string | number>());

  useEffect(() => {
    const toastType = searchParams.get("toast");
    if (!toastType) return;

    const config = TOAST_MESSAGES[toastType as ToastType];
    if (!config) return;

    const toastId = searchParams.get("toastId");
    if (!toastId || shownToasts.current.has(toastId)) return;

    shownToasts.current.add(toastId);

    // Get all data params (any param starting with toastData_)
    const data: Record<string, string> = {};
    const entries = Array.from(searchParams.entries());
    entries.forEach(([key, value]) => {
      if (key.startsWith("toastData_")) {
        data[key.replace("toastData_", "")] = value;
      }
    });

    const description =
      typeof config.description === "function"
        ? config.description(data)
        : config.description;

    const toastFn = config.type ? toast[config.type] : toast;
    toastFn(config.title, {
      description,
      closeButton: true,
    });

    // Clean up toast params without refresh
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete("toast");
    const paramsToDelete = Array.from(newParams.keys()).filter((key) =>
      key.startsWith("toastData_")
    );

    paramsToDelete.forEach((key) => newParams.delete(key));
    router.replace(
      window.location.pathname +
        (newParams.toString() ? `?${newParams.toString()}` : ""),
      { scroll: false }
    );
  }, [searchParams, router]);

  const showToast = (type: string, data?: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("toast", type);
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        params.set(`toastData_${key}`, value);
      });
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
