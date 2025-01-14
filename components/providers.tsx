"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

import { ToastProvider } from "@/hooks/use-toast";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
          <Toaster richColors position="top-center" />
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
