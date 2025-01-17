"use client";

import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification, NotificationType } from "@/database";

type NotificationGroup = {
  type: NotificationType;
  notifications: Notification[];
};

const getNotificationTypeLabel = (type: NotificationType) => {
  switch (type) {
    case NotificationType.DesignChatMessage:
      return "Mensajes de diseño";
    default:
      return type;
  }
};

export function NotificationList({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef as never);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["notifications"],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        if (pageParam) params.set("cursor", pageParam);
        const response = await fetch(`/api/notifications?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch notifications");
        return response.json();
      },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: null,
    });

  const { mutate: markAsRead } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/notifications/read", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to mark notifications as read");
      return response.json();
    },
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNotificationClick = (notification: Notification) => {
    markAsRead();
    onClose();
    router.push(notification.deepLink);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  if (notifications.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 text-muted-foreground">
        No hay notificaciones
      </div>
    );
  }

  // Group notifications by type
  const groups = notifications.reduce<NotificationGroup[]>(
    (acc, notification) => {
      const group = acc.find((g) => g.type === notification.type);
      if (group) {
        group.notifications.push(notification);
      } else {
        acc.push({
          type: notification.type,
          notifications: [notification],
        });
      }
      return acc;
    },
    []
  );

  return (
    <ScrollArea className="h-[32rem] w-80">
      <div className="p-4 space-y-6">
        {groups.map((group) => (
          <div key={group.type}>
            <h3 className="font-medium mb-2">
              {getNotificationTypeLabel(group.type)}
            </h3>
            <div className="space-y-2">
              {group.notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    notification.isRead
                      ? "bg-muted hover:bg-muted/80"
                      : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div ref={loadMoreRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="flex justify-center p-4">
            <Loader className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
