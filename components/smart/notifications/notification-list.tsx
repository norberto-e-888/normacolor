"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
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
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notifications-count"] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(["notifications"]);
      const previousCount = queryClient.getQueryData(["notifications-count"]);

      // Optimistically update notifications to show all as read
      queryClient.setQueryData(["notifications"], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          notifications: page.notifications.map(
            (notification: Notification) => ({
              ...notification,
              isRead: true,
            })
          ),
        })),
      }));

      // Optimistically update count to 0
      queryClient.setQueryData(["notifications-count"], { count: 0 });

      // Return a context object with the snapshotted value
      return { previousNotifications, previousCount };
    },
    onError: (_, __, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ["notifications"],
        context.previousNotifications
      );
      queryClient.setQueryData(["notifications-count"], context.previousCount);
    },
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNotificationClick = (notification: Notification) => {
    // Only mark as read if not already read
    if (!notification.isRead) {
      markAsRead();
    }
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
        No hay notificaciones sin leer
      </div>
    );
  }

  // Group notifications by type (only unread ones)
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
                  className="w-full text-left p-3 rounded-lg transition-colors bg-primary/5 hover:bg-primary/10"
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
