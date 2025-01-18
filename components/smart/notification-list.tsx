"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronDown, Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useIntersectionObserver } from "usehooks-ts";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification, NotificationType } from "@/database";

type NotificationGroup = {
  type: NotificationType;
  dates: {
    date: string;
    notifications: Notification[];
  }[];
};

const getNotificationTypeLabel = (type: NotificationType) => {
  switch (type) {
    case NotificationType.DesignChatMessage:
      return "Mensajes de diseño";
    case NotificationType.OrderReady:
      return "Pedido listo";
    default:
      return type;
  }
};

const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Hoy";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  } else {
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
    });
  }
};

export function NotificationList({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { isIntersecting } = useIntersectionObserver(loadMoreRef as never);
  const openSectionRef = useRef<NotificationType | null>(null);

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
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notifications-count"] });

      const previousNotifications = queryClient.getQueryData(["notifications"]);
      const previousCount = queryClient.getQueryData(["notifications-count"]);

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

      queryClient.setQueryData(["notifications-count"], { count: 0 });

      return { previousNotifications, previousCount };
    },
    onError: (_, __, context: any) => {
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

  // Group notifications by type and date
  const groups = notifications.reduce<NotificationGroup[]>(
    (acc, notification) => {
      const date = new Date(notification.createdAt);
      const dateStr = date.toDateString();

      const typeGroup = acc.find((g) => g.type === notification.type);
      if (typeGroup) {
        const dateGroup = typeGroup.dates.find((d) => d.date === dateStr);
        if (dateGroup) {
          dateGroup.notifications.push(notification);
        } else {
          typeGroup.dates.push({
            date: dateStr,
            notifications: [notification],
          });
        }
      } else {
        acc.push({
          type: notification.type,
          dates: [
            {
              date: dateStr,
              notifications: [notification],
            },
          ],
        });
      }
      return acc;
    },
    []
  );

  // Sort dates within each type group
  groups.forEach((group) => {
    group.dates.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });

  return (
    <ScrollArea className="h-[32rem] w-80">
      <div className="p-4 space-y-4">
        {groups.map((group) => {
          const isOpen = openSectionRef.current === group.type;
          const notificationCount = group.dates.reduce(
            (sum, date) => sum + date.notifications.length,
            0
          );

          return (
            <div key={group.type} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => {
                  openSectionRef.current = isOpen ? null : group.type;
                  // Force re-render
                  router.refresh();
                }}
                className="w-full px-4 py-3 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {getNotificationTypeLabel(group.type)}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    ({notificationCount})
                  </span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`transition-all duration-200 ${
                  isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                } overflow-hidden`}
              >
                <div className="p-4 space-y-4">
                  {group.dates.map(({ date, notifications }) => (
                    <div key={date} className="space-y-3">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {formatDate(new Date(date))}
                      </h4>
                      <div className="space-y-2">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="w-full text-left p-3 rounded-lg transition-colors bg-primary/5 hover:bg-primary/10"
                          >
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(
                                notification.createdAt
                              ).toLocaleTimeString()}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
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
