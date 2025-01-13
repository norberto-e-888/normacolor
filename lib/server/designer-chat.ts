import { Redis } from "@upstash/redis";

// Separate Redis client for chat functionality
export const chatRedis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export type ChatMessage = {
  id: string;
  orderItemId: string;
  senderId: string;
  senderRole: "designer" | "client";
  content: string;
  timestamp: number;
};

const CHAT_KEY_PREFIX = "chat";
const CHAT_TTL = 60 * 60 * 24 * 30; // 30 days

export class DesignerChat {
  static getMessagesKey(orderItemId: string) {
    return `${CHAT_KEY_PREFIX}:${orderItemId}/messages`;
  }

  static getImagesKey(orderItemId: string) {
    return `${CHAT_KEY_PREFIX}:${orderItemId}/designer_images`;
  }

  static async addMessage(message: Omit<ChatMessage, "id" | "timestamp">) {
    const key = this.getMessagesKey(message.orderItemId);
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const chatMessage: ChatMessage = {
      ...message,
      id,
      timestamp,
    };

    await chatRedis
      .multi()
      .rpush(key, JSON.stringify(chatMessage)) // Changed from lpush to rpush
      .expire(key, CHAT_TTL)
      .exec();

    return chatMessage;
  }

  static async getMessages(orderItemId: string, limit = 50) {
    const key = this.getMessagesKey(orderItemId);
    const messages = await chatRedis.lrange(key, 0, limit - 1);
    // this casting is safe because our Redis instance automatically serializes and deserializes JSON
    return messages as unknown as ChatMessage[];
  }

  static async addDesignerImage(orderItemId: string, imageUrl: string) {
    const key = this.getImagesKey(orderItemId);
    await chatRedis
      .multi()
      .rpush(key, imageUrl) // Changed from lpush to rpush for consistency
      .expire(key, CHAT_TTL)
      .exec();
  }

  static async getDesignerImages(orderItemId: string) {
    const key = this.getImagesKey(orderItemId);
    return chatRedis.lrange(key, 0, -1);
  }

  static async deleteChat(orderItemId: string) {
    const messagesKey = this.getMessagesKey(orderItemId);
    const imagesKey = this.getImagesKey(orderItemId);
    await chatRedis.del(messagesKey, imagesKey);
  }
}
