import { PusherChannelType } from "@/constants/pusher";

export const getPusherChannelName = {
  orderItemChat: (orderId: string, itemId: string) =>
    `${PusherChannelType.OrderChat}_${orderId}-${itemId}`,
  notifications: (userId: string) =>
    `${PusherChannelType.Notifications}_${userId}`,
  adminStats: (type: string) => `${PusherChannelType.AdminStats}_${type}`, // Add this
};
