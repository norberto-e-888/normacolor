"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Bell, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Notification, NotificationType } from "@/database";

import { NotificationsResponse } from "../smart/notification-listener";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// Simplified time formatting function
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "ahora mismo";
  if (diffMins < 60) return `hace ${diffMins} min`;
  if (diffHours < 24) return `hace ${diffHours} h`;
  if (diffDays < 7) return `hace ${diffDays} d`;

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.DesignChatMessage:
      return "💬";
    case NotificationType.OrderReady:
      return "✅";
    case NotificationType.NewOrder:
      return "🛒";
    case NotificationType.ArtApproved:
      return "👍";
    case NotificationType.DesignApprovalPending:
      return "🎨";
    case NotificationType.OrderStatusPending:
      return "⏳";
    case NotificationType.OrderStatusInProgress:
      return "🔄";
    case NotificationType.OrderStatusCompleted:
      return "✅";
    case NotificationType.OrderStatusCancelled:
      return "❌";
    case NotificationType.OrderStatusDelivered:
      return "📦";
    default:
      return "📣";
  }
}

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications?limit=5");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      // Optimistically update the UI
      queryClient.setQueryData<NotificationsResponse>(
        ["notifications"],
        (old) => {
          if (!old) return { notifications: [], unreadCount: 0 };

          return {
            ...old,
            notifications: old.notifications.filter((n) => n.id !== id),
            unreadCount: Math.max(0, old.unreadCount - 1),
          };
        }
      );

      // Make the API call
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Revert on error
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Optimistically update the UI
      queryClient.setQueryData<NotificationsResponse>(
        ["notifications"],
        () => ({ notifications: [], unreadCount: 0 })
      );

      // Make the API call
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ all: true }),
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      // Revert on error
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const handleNotificationClick = (
    notification: Notification & { id: string }
  ) => {
    setIsOpen(false);

    // Mark as read
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    // Navigate to the target page
    router.push(notification.deepLink);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notificaciones"
          >
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-[1.2rem] flex items-center justify-center bg-red-500">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between p-2">
            <h3 className="text-sm font-medium">Notificaciones</h3>
          </div>
          <DropdownMenuSeparator />

          {notifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tienes notificaciones
            </div>
          ) : (
            <>
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-3 gap-1 cursor-pointer ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex w-full gap-2">
                    <span className="text-lg flex-shrink-0">
                      {getNotificationIcon(
                        notification.type as NotificationType
                      )}
                    </span>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(new Date(notification.createdAt))}
                        </p>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <Link
                href="/notificaciones"
                className="block text-center text-sm py-2 text-primary hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Ver todas
              </Link>

              {unreadCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs justify-center"
                    onClick={handleMarkAllAsRead}
                  >
                    Marcar todas como leídas
                  </Button>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
