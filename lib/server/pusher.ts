import PusherServer from "pusher";

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_APP_ID!,
  secret: process.env.PUSHER_API_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});
