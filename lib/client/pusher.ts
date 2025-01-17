import PusherClient from "pusher-js";

console.log("Initializing Pusher client with:", {
  appKey: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
});

PusherClient.logToConsole = process.env.NODE_ENV === "development";

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    channelAuthorization: {
      endpoint: "/api/auth/pusher",
      transport: "ajax",
    },
  }
);
