"use client";

import { FileImage, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { Content } from "@/components/ui";
import { ArtSource, OrderArt, OrderProductOptions } from "@/database";
import { Art, fetchArts } from "@/functions/art";
import { createOrder } from "@/functions/orders";
import { useCart } from "@/hooks/useCart";
import { formatCents } from "@/utils";

const SEARCH_TERM_MAP: Record<string, string> = {
  "tarjetas de presentación": "business cards print-ready",
  postales: "postcards print-ready",
  carpetas: "folders print-ready",
  "hojas membretes": "letterhead print-ready",
  volantes: "flyers print-ready",
  afiches: "posters print-ready",
  plastificado: "laminated print-ready",
  "barniz uv": "uv coating print-ready",
  brochures: "brochures print-ready",
  "pad de facturas y recibos": "invoice receipt print-ready",
};

type ArtTab = "freepik" | "custom";

export default function CheckoutPage() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<ArtTab>("freepik");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [arts, setArts] = useState<Art[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedArts, setSelectedArts] = useState<Record<string, OrderArt>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, totalPrice, clearCart, removeItem } = useCart();
  const selectedItem = items.find((item) => item.id === selectedItemId);
  const allItemsHaveArt = items.every((item) => selectedArts[item.id]);
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value);
  }, 500);

  useEffect(() => {
    if (selectedItem && debouncedSearchTerm.trim()) {
      const fetchFreepikArts = async () => {
        setIsLoading(true);
        try {
          const baseSearchTerm =
            SEARCH_TERM_MAP[selectedItem.name] || selectedItem.name;
          const { arts: fetchedArts } = await fetchArts({
            term: `${debouncedSearchTerm} ${baseSearchTerm}`,
          });
          setArts(fetchedArts);
        } catch (error) {
          console.error("Error fetching arts:", error);
          toast.error("Error al buscar diseños");
        } finally {
          setIsLoading(false);
        }
      };

      fetchFreepikArts();
    }
  }, [debouncedSearchTerm, selectedItem]);

  const handleArtSelect = (art: Art) => {
    if (!selectedItemId) return;

    setSelectedArts((prev) => ({
      ...prev,
      [selectedItemId]: {
        source: ArtSource.Freepik,
        value: art.id.toString(),
      },
    }));

    setSelectedItemId(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItemId || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (!file.name.toLowerCase().endsWith(".psd")) {
      toast.error("Por favor selecciona un archivo PSD");
      return;
    }

    setSelectedArts((prev) => ({
      ...prev,
      [selectedItemId]: {
        source: ArtSource.Custom,
        value: URL.createObjectURL(file),
      },
    }));

    setSelectedItemId(null);
  };

  const handleSubmitOrder = async () => {
    if (!allItemsHaveArt) return;

    setIsSubmitting(true);
    try {
      const cart = items.map((item) => {
        // Convert array options to single values
        const options: OrderProductOptions = {};

        if (item.options.sides?.length) {
          options.sides = item.options.sides[0];
        }
        if (item.options.finish?.length) {
          options.finish = item.options.finish[0];
        }
        if (item.options.paper?.length) {
          options.paper = item.options.paper[0];
        }
        if (item.options.dimensions?.length) {
          options.dimensions = item.options.dimensions[0];
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          options,
          art: selectedArts[item.id],
        };
      });

      const { uploadUrls } = await createOrder(cart, totalPrice());

      // Handle custom art uploads
      if (uploadUrls.length > 0) {
        await Promise.all(
          uploadUrls.map(async ({ url, itemId }) => {
            const art = selectedArts[itemId];
            if (art.source !== ArtSource.Custom) return;

            const response = await fetch(art.value);
            const blob = await response.blob();
            await fetch(url, {
              method: "PUT",
              body: blob,
              headers: {
                "Content-Type": "application/octet-stream",
              },
            });
          })
        );
      }

      toast.success("Orden creada exitosamente");
      clearCart();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear la orden");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    setSelectedArts((prev) => {
      const newArts = { ...prev };
      delete newArts[id];
      return newArts;
    });
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  if (items.length === 0) {
    return (
      <Content>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-lg text-muted-foreground">Tu carrito está vacío</p>
          <a href="/productos" className="text-primary hover:underline">
            Ver productos
          </a>
        </div>
      </Content>
    );
  }

  const getTooltipText = () => {
    const itemsWithoutArt = items.filter((item) => !selectedArts[item.id]);

    if (itemsWithoutArt.length === 0) {
      return "Proceder al pago";
    }

    if (itemsWithoutArt.length <= 3) {
      return itemsWithoutArt
        .map((item) => `• ${item.name}`)
        .join("\n")
        .concat("\nrequieren arte");
    }

    return `${itemsWithoutArt.length} productos requieren arte`;
  };

  return (
    <Content>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Carrito</h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-green-600">
              Total: {formatCents(totalPrice())}
            </div>
            <button
              onClick={handleSubmitOrder}
              disabled={!allItemsHaveArt || isSubmitting}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              title={getTooltipText()}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                "Pagar"
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 overflow-auto">
          {/* Cart Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Productos</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`relative p-4 border rounded-lg ${
                    selectedItemId === item.id ? "border-primary" : ""
                  }`}
                >
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
                    aria-label="Eliminar item"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <div className="flex justify-between items-start pr-8">
                    <div>
                      <h3 className="font-medium capitalize">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Cantidad: {item.quantity}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Precio: {formatCents(item.price)}
                      </p>
                    </div>
                    {selectedArts[item.id] ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600">
                          ✓ Diseño seleccionado
                        </span>
                        <button
                          onClick={() => setSelectedItemId(item.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedItemId(item.id)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Seleccionar diseño
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Art Selection */}
          {selectedItemId && (
            <div className="space-y-4">
              <div className="flex gap-4 border-b">
                <button
                  onClick={() => setSelectedTab("freepik")}
                  className={`px-4 py-2 ${
                    selectedTab === "freepik"
                      ? "border-b-2 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <FileImage className="w-5 h-5 inline-block mr-2" />
                  Diseños Freepik
                </button>
                <button
                  onClick={() => setSelectedTab("custom")}
                  className={`px-4 py-2 ${
                    selectedTab === "custom"
                      ? "border-b-2 border-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  <Upload className="w-5 h-5 inline-block mr-2" />
                  Subir diseño
                </button>
              </div>

              {selectedTab === "freepik" ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar diseños..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        debouncedSearch(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {arts.map((art) => (
                        <button
                          key={art.id}
                          onClick={() => handleArtSelect(art)}
                          className="relative aspect-square overflow-hidden rounded-lg border hover:border-primary transition-colors"
                        >
                          <Image
                            src={art.image.source.url}
                            alt={art.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Arrastra tu archivo PSD aquí o
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".psd"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Seleccionar archivo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Content>
  );
}
