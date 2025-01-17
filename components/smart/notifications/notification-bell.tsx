"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { PusherEventName } from "@/constants/pusher";
import { Notification } from "@/database";
import { pusherClient } from "@/lib/client/pusher";
import { getPusherChannelName } from "@/utils/pusher";

export function NotificationBell({ onClick }: { onClick: () => void }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const { data } = useQuery({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      const response = await fetch("/api/notifications/unread/count");
      if (!response.ok) throw new Error("Failed to fetch notifications count");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = pusherClient.subscribe(
      getPusherChannelName.notifications(session.user.id)
    );

    channel.bind(
      PusherEventName.NewNotification,
      (notification: Notification) => {
        // Update notifications count
        queryClient.setQueryData<{ count: number }>(
          ["notifications-count"],
          (old) => ({
            count: (old?.count || 0) + 1,
          })
        );

        // Update notifications list if it exists in the cache
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryClient.setQueryData(["notifications"], (old: any) => {
          if (!old?.pages?.[0]) return old;
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                notifications: [notification, ...old.pages[0].notifications],
              },
              ...old.pages.slice(1),
            ],
          };
        });
      }
    );

    return () => {
      if (session?.user?.id) {
        pusherClient.unsubscribe(
          getPusherChannelName.notifications(session.user.id)
        );
      }
    };
  }, [session?.user?.id, queryClient]);

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
