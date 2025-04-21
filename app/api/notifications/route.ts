import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { PusherEventName } from "@/constants/pusher";
import { Notification, NotificationType } from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";
import { createPusherServer } from "@/lib/server/pusher";
import { getPusherChannelName } from "@/utils/pusher";

// Fetches notifications for the current user
export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const unreadOnly = searchParams.get("unreadOnly") !== "false";

  await connectToMongo();

  try {
    // Create query with filters
    const query: { userId: string; isRead?: boolean } = {
      userId: session.user.id,
    };
    if (unreadOnly) {
      query.isRead = false;
    }

    // Count total unread for badge displays
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    // Get paginated notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    // Format for response
    const formattedNotifications = notifications.map((notification) => ({
      ...notification,
      id: notification._id.toString(),
      _id: undefined,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return new NextResponse("Error fetching notifications", { status: 500 });
  }
}

// Creates a new notification and sends a Pusher event
export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (session.user.role !== "admin") {
    return new NextResponse("Unauthorized, admin only", { status: 403 });
  }

  await connectToMongo();

  try {
    const body = await request.json();
    const { userId, type, title, message, deepLink, metadata } = body;

    if (!userId || !type || !title || !message || !deepLink) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return new NextResponse("Invalid notification type", { status: 400 });
    }

    // Create notification in database
    const notification = await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      title,
      message,
      deepLink,
      metadata,
      isRead: false,
    });

    // Prepare notification data for Pusher
    const notificationData = {
      id: notification._id.toString(),
      userId,
      type,
      title,
      message,
      deepLink,
      metadata,
      isRead: false,
      createdAt: notification.createdAt,
    };

    // Send Pusher event to notify client
    const pusherServer = createPusherServer();
    const userNotificationsChannel = getPusherChannelName.notifications(userId);

    await pusherServer.trigger(
      userNotificationsChannel,
      PusherEventName.NewNotification,
      notificationData
    );

    return NextResponse.json({
      success: true,
      notification: notificationData,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return new NextResponse("Error creating notification", { status: 500 });
  }
}

// Marks notification(s) as read
export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();

  try {
    const body = await request.json();
    const { id, all } = body;

    if (!id && !all) {
      return new NextResponse("Missing id or all parameter", { status: 400 });
    }

    if (id) {
      // Mark a single notification as read
      const notification = await Notification.findById(id);

      if (!notification) {
        return new NextResponse("Notification not found", { status: 404 });
      }

      // Ensure the user only updates their own notifications
      if (notification.userId.toString() !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

      notification.isRead = true;
      await notification.save();

      return NextResponse.json({ success: true });
    } else if (all) {
      // Mark all notifications as read
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { isRead: true }
      );

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return new NextResponse("Error updating notifications", { status: 500 });
  }
}
