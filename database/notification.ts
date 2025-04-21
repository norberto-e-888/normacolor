import mongoose, { Model } from "mongoose";

import { BaseModel, ensureRefIntegrity, getSchema, ModelName } from "@/utils";

export enum NotificationType {
  DesignChatMessage = "design_chat_message",
  OrderReady = "order_ready",
  NewOrder = "new_order",
  ArtApproved = "art_approved",
  DesignApprovalPending = "design_approval_pending",
  OrderStatusPending = "order_status_pending",
  OrderStatusInProgress = "order_status_in_progress",
  OrderStatusCompleted = "order_status_completed",
  OrderStatusCancelled = "order_status_cancelled",
  OrderStatusDelivered = "order_status_delivered",
}

export type Notification = {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  deepLink: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
} & BaseModel;

const notificationSchema = getSchema<Notification>({
  userId: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: ModelName.User,
  },
  type: {
    type: String,
    required: true,
    enum: Object.values(NotificationType),
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  deepLink: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    required: true,
    default: false,
  },
  metadata: {
    type: Object,
    required: false,
  },
});

notificationSchema.pre("save", ensureRefIntegrity);
notificationSchema.index({
  userId: 1,
  type: 1,
  isRead: 1,
});

export const Notification: Model<Notification> =
  mongoose.models?.Notification ||
  mongoose.model(ModelName.Notification, notificationSchema);
