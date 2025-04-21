"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import { PusherEventName } from "@/constants/pusher";
import { Notification } from "@/database";
import { pusherClient } from "@/lib/client/pusher";
import { getPusherChannelName } from "@/utils/pusher";

export interface NotificationsResponse {
  notifications: Array<Notification & { id: string }>;
  unreadCount: number;
}

/**
 * Component that listens for push notifications and updates the notification state
 * This should be included once in the app's layout
 */
export function NotificationListener() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Initialize notifications query to ensure it's in cache
  useQuery<NotificationsResponse>({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!session?.user) {
        return { notifications: [], unreadCount: 0 };
      }

      const response = await fetch("/api/notifications");
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      return response.json();
    },
    enabled: !!session?.user,
  });

  // Set up Pusher subscription to listen for new notifications
  useEffect(() => {
    if (!session?.user) return;

    const userId = session.user.id as string;
    const channelName = getPusherChannelName.notifications(userId);
    const channel = pusherClient.subscribe(channelName);

    // When a new notification comes in
    channel.bind(
      PusherEventName.NewNotification,
      (notification: Notification & { id: string }) => {
        // Update the notifications data in cache
        queryClient.setQueryData<NotificationsResponse>(
          ["notifications"],
          (oldData) => {
            if (!oldData) {
              return {
                notifications: [notification],
                unreadCount: 1,
              };
            }

            // Add the new notification to the top of the list
            return {
              notifications: [notification, ...oldData.notifications],
              unreadCount: oldData.unreadCount + 1,
            };
          }
        );

        // You could also show a toast notification here
      }
    );

    // Clean up subscription on unmount
    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [session?.user, queryClient]);

  // This component doesn't render anything - it just handles notification state
  return null;
}
