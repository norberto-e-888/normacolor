"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Paperclip, Send, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SessionUser } from "@/auth";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/database";
import { ChatMessage } from "@/lib/server/designer-chat";

import { S3Image } from "./s3-image";

interface OrderChatProps {
  orderId: string;
  itemId: string;
}

export function OrderChat({ orderId, itemId }: OrderChatProps) {
  const { data: session } = useSession();
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
    if (!file.name.toLowerCase().endsWith(".psd")) {
      toast.error("Por favor selecciona un archivo PSD", {
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

  const handleDownload = async (imageId: string) => {
    try {
      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}/chat/images/${imageId}`
      );
      if (!response.ok) throw new Error("Failed to get download URL");
      const { url } = await response.json();

      const link = document.createElement("a");
      link.href = url;
      link.download = `design-${imageId}.psd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Descarga iniciada");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Error al descargar el archivo");
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      const response = await fetch(
        `/api/orders/${orderId}/items/${itemId}/chat/images/${imageId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete image");

      await refetchImages();
      toast.success("Imagen eliminada exitosamente");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Error al eliminar la imagen");
    }
  };

  const ImageCarousel = ({
    images,
    title,
    isDesignerImages,
  }: {
    images: string[];
    title: string;
    isDesignerImages: boolean;
  }) => {
    if (!images?.length) return null;

    return (
      <div className="mb-4">
        <h5 className="text-sm font-medium mb-2">{title}</h5>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((imageId) => (
            <div
              key={imageId}
              className="relative w-20 h-20 flex-shrink-0 border rounded-lg overflow-hidden group"
            >
              <S3Image s3Key={`chat/${itemId}/${imageId}/preview.png`} />
              <div className="absolute bottom-1 right-1 flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(imageId);
                  }}
                  className="p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                </button>
                {((isDesignerImages &&
                  (session?.user as SessionUser).role === UserRole.Admin) ||
                  (!isDesignerImages &&
                    (session?.user as SessionUser).role !==
                      UserRole.Admin)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(imageId);
                    }}
                    className="p-1 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium mb-3">Chat con diseñador</h4>

      <ImageCarousel
        images={imagesData?.designerImages || []}
        title="Diseños propuestos"
        isDesignerImages={true}
      />
      <ImageCarousel
        images={imagesData?.clientImages || []}
        title="Tus diseños"
        isDesignerImages={false}
      />

      <div
        ref={messagesContainerRef}
        className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4 relative"
      >
        <div className="space-y-4">
          {messagesData?.messages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderRole === "client"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.senderRole === "client"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
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
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={isLoading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".psd"
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
          <Paperclip className="w-4 h-4" />
        </Button>
        <Button type="submit" disabled={isLoading || !newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
