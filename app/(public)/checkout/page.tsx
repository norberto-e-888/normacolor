"use client";

import { FileImage, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { Content, Tooltip } from "@/components/ui";
import { ArtSource, OrderArt, OrderProductOptions } from "@/database";
import { Art, fetchArts } from "@/functions/art";
import { createOrder } from "@/functions/orders";
import { useCart } from "@/hooks/useCart";
import { formatCents } from "@/utils";

const SEARCH_TERM_MAP: Record<string, string> = {
  "tarjetas de presentación": "business card",
  postales: "postcard",
  carpetas: "folder",
  "hojas membretes": "letterhead",
  volantes: "flyer",
  afiches: "poster",
  plastificado: "laminated",
  "barniz uv": "uv coating",
  brochures: "brochure",
  "pad de facturas y recibos": "invoice receipt pad",
};

type ArtTab = "freepik" | "custom";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCart((state) => state.items);
  const totalPrice = useCart((state) => state.totalPrice());
  const removeItem = useCart((state) => state.removeItem);
  const [selectedItem, setSelectedItem] = useState<(typeof items)[0] | null>(
    null
  );

  const [selectedTab, setSelectedTab] = useState<ArtTab>("freepik");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [arts, setArts] = useState<Art[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value);
  }, 500);

  const itemsMissingArt = items.filter((item) => !item.art);
  const allItemsHaveArt = itemsMissingArt.length === 0;
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if we're leaving the dropzone itself
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file || !selectedItem) return;

    const validTypes = [".psd", ".ai", ".pdf"];
    const fileExtension = file.name
      .toLowerCase()
      .slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(fileExtension)) {
      toast.error("Formato de archivo no soportado");
      return;
    }

    const updatedItems = items.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            art: {
              source: ArtSource.Custom,
              value: URL.createObjectURL(file),
            },
          }
        : item
    );

    useCart.setState({ items: updatedItems });
    setSelectedItem(null);
  };

  const handleSubmitOrder = useCallback(async () => {
    if (!allItemsHaveArt) return;

    // Check if user is logged in
    const response = await fetch("/api/auth/session");
    const session = await response.json();

    if (!session) {
      // Save current URL to redirect back after login
      const currentUrl = window.location.pathname + window.location.search;
      router.push(
        `/login?callbackUrl=${encodeURIComponent(
          currentUrl + (currentUrl.includes("?") ? "&" : "?") + "fromLogin=true"
        )}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const { uploadUrls } = await createOrder(
        items.map(({ productId, quantity, options, art }) => ({
          productId,
          quantity,
          options: options as OrderProductOptions,
          art: art as OrderArt,
        })),
        totalPrice
      );

      // Handle file uploads for custom arts
      const uploads = items
        .filter((item) => item.art?.source === ArtSource.Custom)
        .map((item) => {
          const upload = uploadUrls.find((u) => u.itemId === item.productId);
          if (!upload) return null;

          return fetch(upload.url, {
            method: "PUT",
            body: item.art?.value,
          });
        })
        .filter(Boolean);

      await Promise.all(uploads);

      toast.success("Orden creada exitosamente");
      useCart.setState({ items: [] });
      router.push("/ordenes");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear la orden");
    } finally {
      setIsSubmitting(false);
    }
  }, [allItemsHaveArt, items, router, totalPrice]);

  const handleArtSelect = async (art: Art) => {
    if (!selectedItem) return;

    const updatedItems = items.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            art: {
              source: ArtSource.Freepik,
              value: art.id.toString(),
            },
          }
        : item
    );

    useCart.setState({ items: updatedItems });
    setSelectedItem(null);
    setArts([]);
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItem || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    const updatedItems = items.map((item) =>
      item.id === selectedItem.id
        ? {
            ...item,
            art: {
              source: ArtSource.Custom,
              value: URL.createObjectURL(file),
            },
          }
        : item
    );

    useCart.setState({ items: updatedItems });
    setSelectedItem(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getTooltipText = () => {
    if (allItemsHaveArt) return "";
    if (itemsMissingArt.length > 3) {
      return `${itemsMissingArt.length} productos necesitan selección de arte`;
    }

    return `Los siguientes productos necesitan selección de arte:
    ${itemsMissingArt.map((item) => `• ${item.name}`).join("\n")}`;
  };

  useEffect(() => {
    const fromLogin = searchParams.get("fromLogin") === "true";
    if (fromLogin) {
      toast.success("¿Listo para proceder al pago?", {
        action: {
          label: "Pagar",
          onClick: handleSubmitOrder,
        },
      });
    }
  }, [handleSubmitOrder, searchParams]);

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

  return (
    <Content>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex justify-between items-center p-4 border-b">
          <h1 className="text-2xl font-bold">Carrito</h1>
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-green-600">
              Total: {formatCents(totalPrice)}
            </div>
            <Tooltip text={getTooltipText()}>
              <button
                onClick={handleSubmitOrder}
                disabled={!allItemsHaveArt || isSubmitting}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  "Pagar"
                )}
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 border-r overflow-y-auto p-4 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 bg-white rounded-lg shadow cursor-pointer transition-colors ${
                  selectedItem?.id === item.id
                    ? "border-2 border-primary"
                    : "border hover:border-primary"
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold capitalize">{item.name}</h3>
                  <p className="text-sm text-gray-600">
                    Cantidad: {item.quantity} - {formatCents(item.price)}
                  </p>
                  {item.art && (
                    <div className="flex items-center gap-2 mt-2">
                      {item.art.source === ArtSource.Freepik ? (
                        <FileImage size={20} className="text-green-500" />
                      ) : (
                        <Upload size={20} className="text-green-500" />
                      )}
                      <span className="text-sm text-green-600">
                        Arte seleccionado
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full ml-4"
                >
                  <X />
                </button>
              </div>
            ))}
          </div>

          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedTab("freepik")}
                    className={`px-4 py-2 rounded-lg ${
                      selectedTab === "freepik"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100"
                    }`}
                  >
                    Galería
                  </button>
                  <button
                    onClick={() => setSelectedTab("custom")}
                    className={`px-4 py-2 rounded-lg ${
                      selectedTab === "custom"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100"
                    }`}
                  >
                    Subir arte
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
                  <div
                    ref={dropZoneRef}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg transition-colors ${
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="file"
                      accept=".psd,.ai,.pdf"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <Upload
                      size={48}
                      className={`mb-4 ${
                        isDragging ? "text-primary" : "text-gray-400"
                      }`}
                    />
                    <p className="text-lg font-medium mb-2">
                      Arrastra tu archivo aquí o
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:text-primary/90 font-medium"
                    >
                      selecciona un archivo
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                      Formatos aceptados: PSD, AI, PDF
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecciona un producto para agregar arte
              </div>
            )}
          </div>
        </div>
      </div>
    </Content>
  );
}
