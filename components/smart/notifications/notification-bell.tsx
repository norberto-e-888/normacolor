"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const [mounted, setMounted] = useState(false);
  const { data } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/unread/count");
      if (!response.ok) throw new Error("Failed to fetch notifications count");
      return response.json();
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Button variant="ghost" size="icon" onClick={onClick} className="relative">
      <Bell className="h-5 w-5" />
      {data?.count > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
          {data.count > 99 ? "99+" : data.count}
        </span>
      )}
    </Button>
  );
}
