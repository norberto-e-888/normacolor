export const getPusherChannelName = {
  orderItemChat: (orderId: string, itemId: string) =>
    `private-order-chat_${orderId}-${itemId}`,
};
