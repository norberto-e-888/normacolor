export enum PusherEventName {
  NewMessage = "new-message",
  NewNotification = "new-notification",
  UserCountUpdated = "user-count-updated",
  OrderUpdated = "order-updated",
  ArtApproved = "art-approved",
}

export enum PusherChannelType {
  OrderChat = "private-order-chat",
  Notifications = "private-notifications",
  AdminStats = "private-admin-stats",
  OrderStatus = "private-order-status",
}
