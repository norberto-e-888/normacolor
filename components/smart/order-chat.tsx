"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader, Paperclip, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SessionUser } from "@/auth";
import { Button } from "@/components/ui/button";
import { PusherEventName } from "@/constants/pusher";
import { UserRole } from "@/database";
import { pusherClient } from "@/lib/client/pusher";
import { ChatMessage } from "@/lib/server/designer-chat";
import { getPusherChannelName } from "@/utils";

import { FileCarousel } from "./file-carousel";

export interface OrderChatProps {
  orderId: string;
  itemId: string;
}

export function OrderChat({ orderId, itemId }: OrderChatProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusRef = useRef(false);

  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: ["chat-messages", orderId, itemId],
    queryFn: async () => {
      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}/chat`
      );

      if (!response.ok) throw new Error("Failed to fetch messages");
      return response.json();
    },
  });

  const { data: imagesData, refetch: refetchImages } = useQuery({
    queryKey: ["chat-images", orderId, itemId],
    queryFn: async () => {
      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}/chat/images`
      );

      if (!response.ok) throw new Error("Failed to fetch images");
      return response.json();
    },
  });

  useEffect(() => {
    if (messagesContainerRef.current && chatEndRef.current) {
      const container = messagesContainerRef.current;
      const scrollHeight = container.scrollHeight;
      const height = container.clientHeight;
      const maxScroll = scrollHeight - height;
      container.scrollTop = maxScroll > 0 ? maxScroll : 0;
    }
  }, [messagesData?.messages]);

  useEffect(() => {
    if (shouldFocusRef.current) {
      inputRef.current?.focus();
      shouldFocusRef.current = false;
    }
  }, [messagesData?.messages]);

  useEffect(() => {
    const channelName = getPusherChannelName.orderItemChat(orderId, itemId);
    const channel = pusherClient.subscribe(channelName);

    channel.bind(PusherEventName.NewMessage, (message: ChatMessage) => {
      queryClient.setQueryData<{ messages: ChatMessage[] }>(
        ["chat-messages", orderId, itemId],
        (old) => {
          if (old?.messages.some((m) => m.id === message.id)) {
            return {
              ...old,
            };
          }

          return {
            messages: [...(old?.messages || []), message],
          };
        }
      );
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [itemId, orderId, queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      setNewMessage("");
      shouldFocusRef.current = true;
      await refetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Error al enviar el mensaje");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    const allowedTypes = [".psd", ".png", ".jpg", ".jpeg"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Por favor selecciona un archivo PSD, PNG o JPG", {
        closeButton: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}/chat/images`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload file");

      await refetchImages();
      toast.success("Archivo subido exitosamente");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Error al subir el archivo");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const isCurrentUser = (senderRole: string) => {
    return (
      (senderRole === "designer" &&
        (session?.user as SessionUser)?.role === UserRole.Admin) ||
      (senderRole === "client" &&
        (session?.user as SessionUser)?.role !== UserRole.Admin)
    );
  };

  const isAdmin = (session?.user as SessionUser)?.role === UserRole.Admin;

  return (
    <div className="mt-4 border-t pt-4">
      <FileCarousel
        images={imagesData?.designerImages || []}
        title={isAdmin ? "Archivos enviados" : "Archivos del diseñador"}
        isDesignerImages={true}
        orderId={orderId}
        itemId={itemId}
        isAdmin={isAdmin}
        onRefetchImages={refetchImages}
      />
      <FileCarousel
        images={imagesData?.clientImages || []}
        title={isAdmin ? "Archivos del cliente" : "Archivos enviados"}
        isDesignerImages={false}
        orderId={orderId}
        itemId={itemId}
        isAdmin={isAdmin}
        onRefetchImages={refetchImages}
      />

      <div
        ref={messagesContainerRef}
        className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4 relative"
      >
        <div className="space-y-4">
          {messagesData?.messages.map((message: ChatMessage) => {
            const isOwnMessage = isCurrentUser(message.senderRole);
            return (
              <div
                key={message.id}
                className={`flex ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span
                    className={`text-xs ${
                      isOwnMessage
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} className="h-0 w-full" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-md border px-3 py-2 text-sm w-full"
          disabled={isLoading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".psd,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </Button>
        <Button type="submit" disabled={isLoading || !newMessage.trim()}>
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
