"use client";

import { FileImage, Search, Upload, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import { FreepikImage } from "@/components/smart/freepik-image";
import { S3Image } from "@/components/smart/s3-image";
import { Content } from "@/components/ui/content";
import { Tooltip } from "@/components/ui/tool-tip";
import { ArtSource, LOYALTY_TIER_CONFIG, UserLoyaltyTier } from "@/database";
import { Art, fetchArts } from "@/functions/art";
import { createOrder } from "@/functions/orders";
import { useCart } from "@/hooks/use-cart";
import { formatCents, formatNumber } from "@/utils";

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

// Format a percentage with 0 decimal places
const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

// Function to get next tier based on current tier
const getNextTier = (currentTier: UserLoyaltyTier) => {
  if (currentTier === UserLoyaltyTier.Bronze) return UserLoyaltyTier.Silver;
  if (currentTier === UserLoyaltyTier.Silver) return UserLoyaltyTier.Gold;
  return null; // No next tier if already Gold
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<ArtTab>("freepik");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [arts, setArts] = useState<Art[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const payCtaShown = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, totalPrice, removeItem, updateItemArt } = useCart();
  const selectedItem = items.find((item) => item.id === selectedItemId);
  const allItemsHaveArt = items.every((item) => item.art);
  const debouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearchTerm(value);
  }, 500);

  // User state with more complete loyalty information
  const [userData, setUserData] = useState<{
    unspentLoyaltyPoints: number;
    loyaltyTier: UserLoyaltyTier;
    tierQualificationSpendCents: number;
    totalSpentCents: number;
  } | null>(null);

  // State for selected points to use
  const [selectedPoints, setSelectedPoints] = useState(0);

  const handleSubmitOrder = useCallback(async () => {
    if (!allItemsHaveArt) return;

    setIsSubmitting(true);
    const session = await getSession();
    if (!session) {
      setIsSubmitting(false);
      return router.push("/login?callbackUrl=/checkout?fromLogin=true");
    }

    try {
      // Create a simplified cart object with only the necessary data
      const cart = items.map(({ productId, quantity, options, art }) => ({
        productId,
        quantity,
        options,
        art: art!,
      }));

      // Include selected points to use in order creation
      const orderId = await createOrder(cart, totalPrice(), selectedPoints);
      router.push(`/pagar/${orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Error al crear la orden", {
        closeButton: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [allItemsHaveArt, items, router, totalPrice, selectedPoints]);

  useEffect(() => {
    const fromLogin = searchParams.get("fromLogin");
    if (fromLogin === "true" && !payCtaShown.current) {
      const timer = setTimeout(() => {
        payCtaShown.current = true;
        toast.success("Ahora puedes proceder con el pago", {
          position: "top-center",
          action: {
            label: "Pagar",
            onClick: handleSubmitOrder,
          },
          closeButton: true,
        });
      }, 100);
      return () => clearTimeout(timer);
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
          toast.error("Error al buscar diseños", {
            closeButton: true,
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchFreepikArts();
    }
  }, [debouncedSearchTerm, selectedItem]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const session = await getSession();
        if (session) {
          const response = await fetch("/api/auth/me");
          if (response.ok) {
            const data = await response.json();
            setUserData(data);

            // Initialize selected points to max allowable (with $1 minimum)
            if (data.user.unspentLoyaltyPoints > 0) {
              const minimumPriceCents = 100; // $1 minimum
              const maxPoints = Math.max(0, totalPrice() - minimumPriceCents);
              setSelectedPoints(
                Math.min(data.user.unspentLoyaltyPoints, maxPoints)
              );
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [totalPrice]);

  const handleArtSelect = (art: Art) => {
    if (!selectedItemId) return;

    updateItemArt(selectedItemId, {
      source: ArtSource.Freepik,
      value: art.id.toString(),
    });

    setSelectedItemId(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedItemId || !e.target.files?.[0]) return;

    const file = e.target.files[0];
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Por favor selecciona un archivo PDF", {
        closeButton: true,
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log("Uploading PDF file:", file.name);
      // Get signed URL and folder key for upload
      const response = await fetch("/api/s3/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileType: "pdf" }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to get upload URL:", errorText);
        throw new Error(`Failed to get upload URL: ${errorText}`);
      }

      const { uploadUrl, folderKey, imageId } = await response.json();
      console.log("Upload info received:", { folderKey, imageId });

      // Upload PDF to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "application/pdf",
        },
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Failed to upload file to S3:", errorText);
        throw new Error(`Failed to upload file to S3: ${errorText}`);
      }

      console.log("PDF uploaded to S3, now processing for preview");

      // Process PDF and create preview
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderKey", folderKey);
      formData.append("fileType", "pdf");

      const processResponse = await fetch("/api/s3/process", {
        method: "POST",
        body: formData,
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error("Failed to process PDF:", errorText);
        throw new Error(`Failed to process PDF: ${errorText}`);
      }

      const processResult = await processResponse.json();
      console.log("PDF processed successfully:", processResult);

      // Update the cart item with the new art
      updateItemArt(selectedItemId, {
        source: ArtSource.Custom,
        value: imageId,
      });
      console.log("Cart updated with new PDF art:", imageId);

      setSelectedItemId(null);
      toast.success("PDF subido exitosamente");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al subir el archivo",
        {
          closeButton: true,
        }
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  // Calculate max points that can be used (respecting $1 minimum)
  const getMaxPointsToUse = () => {
    if (!userData) return 0;
    const minimumOrderCents = 100; // $1 minimum
    return Math.min(
      userData.unspentLoyaltyPoints,
      Math.max(0, totalPrice() - minimumOrderCents)
    );
  };

  // Calculate final price after points discount
  const calculateFinalPrice = () => {
    const total = totalPrice();
    // Ensure at least $1 final price
    return Math.max(100, total - selectedPoints);
  };

  // Calculate potential points earned from this order
  const calculatePotentialPoints = () => {
    if (!userData) return 0;

    const finalPrice = calculateFinalPrice();
    const pointsMultiplier =
      LOYALTY_TIER_CONFIG[userData.loyaltyTier].pointsMultiplier;

    // Points are earned on the post-discount amount
    // Convert cents to dollars (1% of dollars spent) before applying multiplier
    const finalPriceDollars = finalPrice / 100;
    return Math.round(finalPriceDollars * pointsMultiplier);
  };

  // Calculate tier progress
  const calculateTierProgress = () => {
    if (!userData) return { percentage: 0, nextTier: null, remaining: 0 };

    const nextTier = getNextTier(userData.loyaltyTier);
    if (!nextTier) return { percentage: 1, nextTier: null, remaining: 0 };

    const currentRequirement =
      LOYALTY_TIER_CONFIG[userData.loyaltyTier].spendingRequirement;
    const nextRequirement = LOYALTY_TIER_CONFIG[nextTier].spendingRequirement;
    const spentTowardsNext = userData.tierQualificationSpendCents;

    const targetSpend = nextRequirement - currentRequirement;
    const currentProgress = Math.min(
      spentTowardsNext - currentRequirement,
      targetSpend
    );
    const percentage = currentProgress / targetSpend;
    const remaining = nextRequirement - spentTowardsNext;

    return {
      percentage,
      nextTier,
      remaining,
    };
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setSelectedPoints(isNaN(value) ? 0 : value);
  };

  if (items.length === 0) {
    return (
      <Content>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-9rem)] gap-4">
          <p className="text-lg text-muted-foreground">Tu carrito está vacío</p>
          <a href="/productos" className="text-primary hover:underline">
            Ver productos
          </a>
        </div>
      </Content>
    );
  }

  const getTooltipText = () => {
    const itemsWithoutArt = items.filter((item) => !item.art);

    if (itemsWithoutArt.length === 0) {
      return "";
    }

    if (itemsWithoutArt.length <= 3) {
      const text = itemsWithoutArt.map((item) => `• ${item.name}`).join("\n");
      return `requieren arte:\n${text}`;
    }

    return `${itemsWithoutArt.length} productos requieren arte`;
  };

  const tierProgress = calculateTierProgress();
  const maxPointsToUse = getMaxPointsToUse();

  return (
    <Content padding={false}>
      <div className="flex flex-col">
        {userData && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="max-w-3xl mx-auto">
              {/* Loyalty Tier Information */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">
                    Tu nivel:{" "}
                    <span className="capitalize font-semibold">
                      {userData.loyaltyTier}
                    </span>
                  </h3>
                  <span className="text-sm text-gray-500">
                    {calculatePotentialPoints()} puntos a ganar con esta compra
                  </span>
                </div>

                {tierProgress.nextTier && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Progreso hacia {tierProgress.nextTier}</span>
                      <span>{formatPercentage(tierProgress.percentage)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{
                          width: formatPercentage(tierProgress.percentage),
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      Te faltan {formatCents(tierProgress.remaining)} para
                      alcanzar el siguiente nivel
                    </div>
                  </div>
                )}
              </div>

              {/* Loyalty Points Usage */}
              {userData.unspentLoyaltyPoints > 0 && (
                <div className="p-3 border rounded-lg bg-white">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Usar puntos de lealtad</h4>
                    <span className="text-sm">
                      {userData.unspentLoyaltyPoints} puntos disponibles
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max={maxPointsToUse}
                        value={selectedPoints}
                        onChange={handlePointsChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max={maxPointsToUse}
                        value={selectedPoints}
                        onChange={handlePointsChange}
                        className="w-20 p-1 border rounded text-center"
                      />
                    </div>

                    <div className="text-sm flex justify-between">
                      <span className="text-gray-500">
                        Descuento aplicado: -{formatCents(selectedPoints)}
                      </span>
                      {totalPrice() - selectedPoints < 100 && (
                        <span className="text-amber-600">
                          El valor mínimo de una orden es de 1 dólar
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between p-2 border-b">
          <div className="flex items-center">{/* Left side content */}</div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-sm">
              <div className="text-gray-500">
                Subtotal: {formatCents(totalPrice())}
              </div>
              {selectedPoints > 0 && (
                <div className="text-green-600">
                  Descuento: -{formatCents(selectedPoints)}
                </div>
              )}
            </div>
            <div className="text-lg font-semibold text-green-600">
              Total: {formatCents(calculateFinalPrice())}
            </div>
            <Tooltip
              show={!allItemsHaveArt}
              text={getTooltipText()}
              position="left"
            >
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
                        Cantidad: {formatNumber(item.quantity)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Precio: {formatCents(item.price)}
                      </p>
                    </div>
                    {item.art ? (
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
                        {/* Add fixed dimensions to the container div */}
                        <div className="mt-2 relative w-32 h-32">
                          {item.art.source === ArtSource.Freepik ? (
                            <FreepikImage id={item.art.value} />
                          ) : (
                            <S3Image
                              namespace="uploads"
                              imageId={item.art.value}
                            />
                          )}
                        </div>
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
                  Plantillas
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
                    Arrastra tu archivo PDF aquí o
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      "Seleccionar archivo"
                    )}
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
