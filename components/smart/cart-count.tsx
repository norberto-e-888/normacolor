"use client";

import { useEffect, useState } from "react";

import { useCart } from "@/hooks/use-cart";

export function CartCount() {
  const [mounted, setMounted] = useState(false);
  const totalItems = useCart((state) => state.totalItems());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return empty span during server render and hydration
  if (!mounted) {
    return <span className="hidden" />;
  }

  if (totalItems === 0) {
    return null;
  }

  return (
    <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
      {totalItems}
    </span>
  );
}
