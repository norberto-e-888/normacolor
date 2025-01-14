import { Redis } from "@upstash/redis";
import { v4 as uuid } from "uuid";

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

  static getDesignerImagesKey(orderItemId: string) {
    return `${CHAT_KEY_PREFIX}:${orderItemId}/designer_images`;
  }

  static getClientImagesKey(orderItemId: string) {
    return `${CHAT_KEY_PREFIX}:${orderItemId}/client_images`;
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
      .rpush(key, JSON.stringify(chatMessage))
      .expire(key, CHAT_TTL)
      .exec();

    return chatMessage;
  }

  static async getMessages(orderItemId: string, limit = 50) {
    const key = this.getMessagesKey(orderItemId);
    const messages = await chatRedis.lrange(key, 0, limit - 1);
    return messages as unknown as ChatMessage[];
  }

  static async addImage(orderItemId: string, isDesigner: boolean) {
    const imageId = uuid();
    const key = isDesigner
      ? this.getDesignerImagesKey(orderItemId)
      : this.getClientImagesKey(orderItemId);

    await chatRedis.multi().rpush(key, imageId).expire(key, CHAT_TTL).exec();

    return imageId;
  }

  static async removeImage(orderItemId: string, imageId: string) {
    const [designerImages] = await Promise.all([
      chatRedis.lrange(this.getDesignerImagesKey(orderItemId), 0, -1),
      chatRedis.lrange(this.getClientImagesKey(orderItemId), 0, -1),
    ]);

    const isDesignerImage = designerImages.includes(imageId);
    const key = isDesignerImage
      ? this.getDesignerImagesKey(orderItemId)
      : this.getClientImagesKey(orderItemId);

    await chatRedis.lrem(key, 0, imageId);
  }

  static async getImages(orderItemId: string) {
    const [designerImages, clientImages] = await Promise.all([
      chatRedis.lrange(this.getDesignerImagesKey(orderItemId), 0, -1),
      chatRedis.lrange(this.getClientImagesKey(orderItemId), 0, -1),
    ]);

    return {
      designerImages,
      clientImages,
    };
  }

  static async deleteChat(orderItemId: string) {
    const messagesKey = this.getMessagesKey(orderItemId);
    const designerImagesKey = this.getDesignerImagesKey(orderItemId);
    const clientImagesKey = this.getClientImagesKey(orderItemId);
    await chatRedis.del(messagesKey, designerImagesKey, clientImagesKey);
  }
}
