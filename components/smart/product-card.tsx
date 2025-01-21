"use client";

import { ChevronLeft, ChevronRight, Plus, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tool-tip";
import { TRANSLATIONS } from "@/constants/translations";
import {
  OrderProductOptions,
  Product,
  ProductOptionFinish,
  ProductOptionPaper,
  ProductOptionSide,
} from "@/database";
import { useCart } from "@/hooks/use-cart";
import { cn } from "@/lib/client";
import { formatCents, formatNumber, getForcedOptions } from "@/utils";
import { calculatePrice } from "@/utils/calculate-price";

const formatOptionLabel = (option: string) => {
  return option
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase());
};

const TOOLTIP_TEXT = "única opción disponible";

export function ProductCard({ product }: { product: Product<true> }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<OrderProductOptions>(
    getForcedOptions(product)
  );

  const [quantity, setQuantity] = useState<number | "">(1);
  const addItem = useCart((state) => state.addItem);
  const calculateItemPrice = () => {
    return calculatePrice(
      typeof quantity === "number" ? quantity : 0,
      product.pricing,
      selectedOptions
    );
  };

  const getValidationMessages = () => {
    const messages: string[] = [];
    const totalPrice = calculateItemPrice();

    if (product.options.sides?.length && !selectedOptions.sides) {
      messages.push("Selecciona los lados");
    }
    if (product.options.paper?.length && !selectedOptions.paper) {
      messages.push("Selecciona el papel");
    }
    if (product.options.finish?.length && !selectedOptions.finish) {
      messages.push("Selecciona el acabado");
    }
    if (product.options.dimensions?.length && !selectedOptions.dimensions) {
      messages.push("Selecciona las dimensiones");
    }
    if (typeof quantity !== "number" || quantity < 1) {
      messages.push("Ingresa una cantidad válida");
    }
    if (totalPrice < product.pricing.minimumPurchase) {
      messages.push(
        `El monto mínimo de compra es ${formatCents(
          product.pricing.minimumPurchase
        )}`
      );
    }

    return messages;
  };

  const isFormComplete = () => getValidationMessages().length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (typeof quantity !== "number") return;

    const totalPrice = calculateItemPrice();
    if (totalPrice < product.pricing.minimumPurchase) {
      toast.error(
        `El monto mínimo de compra es ${formatCents(
          product.pricing.minimumPurchase
        )}`,
        { closeButton: true }
      );
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      quantity,
      options: selectedOptions,
      price: totalPrice,
    });

    setIsModalOpen(false);
    setSelectedOptions(getForcedOptions(product));
    setQuantity(1);
    toast.success(
      `${formatNumber(quantity)} ${product.name} agregado${
        quantity > 1 ? "s" : ""
      } al carrito`,
      { closeButton: true }
    );
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    );
  };

  return (
    <>
      <div className="relative w-full">
        <div className="relative group">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            {product.images.length > 0 ? (
              <>
                <Image
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/40 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {product.images.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-4xl text-muted-foreground">📄</span>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-end">
            <h2 className="text-lg font-semibold text-white capitalize">
              {product.name}
            </h2>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white z-20"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="w-[600px] max-w-full p-6">
          <h2 className="text-2xl font-bold mb-6 capitalize">{product.name}</h2>
          <p className="text-muted-foreground mb-6">
            Podrás seleccionar o subir el arte para tu producto durante el
            proceso de pago.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!!product.options.sides?.length && (
              <div>
                <label className="block text-sm font-bold mb-1">Lados</label>
                {product.options.sides.length === 1 ? (
                  <Tooltip text={TOOLTIP_TEXT}>
                    <select
                      className="w-full border rounded-md p-2"
                      value={selectedOptions.sides || ""}
                      disabled
                      required
                    >
                      <option value={product.options.sides[0]}>
                        {TRANSLATIONS[product.options.sides[0]]}
                      </option>
                    </select>
                  </Tooltip>
                ) : (
                  <select
                    className="w-full border rounded-md p-2"
                    onChange={(e) =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        sides: e.target.value as ProductOptionSide,
                      }))
                    }
                    value={selectedOptions.sides || ""}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {product.options.sides.map((side) => (
                      <option key={side} value={side}>
                        {TRANSLATIONS[side]}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {!!product.options.paper?.length && (
              <div>
                <label className="block text-sm font-bold mb-1">Papel</label>
                {product.options.paper.length === 1 ? (
                  <Tooltip text={TOOLTIP_TEXT}>
                    <select
                      className="w-full border rounded-md p-2"
                      value={selectedOptions.paper || ""}
                      disabled
                      required
                    >
                      <option value={product.options.paper[0]}>
                        {formatOptionLabel(product.options.paper[0])}
                      </option>
                    </select>
                  </Tooltip>
                ) : (
                  <select
                    className="w-full border rounded-md p-2"
                    onChange={(e) =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        paper: e.target.value as ProductOptionPaper,
                      }))
                    }
                    value={selectedOptions.paper || ""}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {product.options.paper.map((paper) => (
                      <option key={paper} value={paper}>
                        {formatOptionLabel(paper)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {!!product.options.finish?.length && (
              <div>
                <label className="block text-sm font-bold mb-1">Acabado</label>
                {product.options.finish.length === 1 ? (
                  <Tooltip text={TOOLTIP_TEXT}>
                    <select
                      className="w-full border rounded-md p-2"
                      value={selectedOptions.finish || ""}
                      disabled
                      required
                    >
                      <option value={product.options.finish[0]}>
                        {formatOptionLabel(product.options.finish[0])}
                      </option>
                    </select>
                  </Tooltip>
                ) : (
                  <select
                    className="w-full border rounded-md p-2"
                    onChange={(e) =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        finish: e.target.value as ProductOptionFinish,
                      }))
                    }
                    value={selectedOptions.finish || ""}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {product.options.finish.map((finish) => (
                      <option key={finish} value={finish}>
                        {formatOptionLabel(finish)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {!!product.options.dimensions?.length && (
              <div>
                <label className="block text-sm font-bold mb-1">
                  Dimensiones
                </label>
                {product.options.dimensions.length === 1 ? (
                  <Tooltip text={TOOLTIP_TEXT}>
                    <select
                      className="w-full border rounded-md p-2"
                      value={JSON.stringify(selectedOptions.dimensions)}
                      disabled
                      required
                    >
                      <option
                        value={JSON.stringify(product.options.dimensions[0])}
                      >
                        {product.options.dimensions[0][0]}" x{" "}
                        {product.options.dimensions[0][1]}"
                      </option>
                    </select>
                  </Tooltip>
                ) : (
                  <select
                    className="w-full border rounded-md p-2"
                    onChange={(e) =>
                      setSelectedOptions((prev) => ({
                        ...prev,
                        dimensions: e.target.value
                          ? JSON.parse(e.target.value)
                          : undefined,
                      }))
                    }
                    value={JSON.stringify(selectedOptions.dimensions)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {product.options.dimensions.map((dim) => (
                      <option key={dim.join("x")} value={JSON.stringify(dim)}>
                        {dim[0]}" x {dim[1]}"
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-1">Cantidad</label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val =
                    e.target.value === "" ? "" : parseInt(e.target.value);

                  setQuantity(val);
                }}
                className="w-full"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-lg font-thin">
                {formatCents(calculateItemPrice())}
              </span>
              <Tooltip
                text={getValidationMessages().join("\n")}
                show={!isFormComplete()}
                position="top"
              >
                <Button
                  type="submit"
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                  style={{
                    cursor: isFormComplete() ? "pointer" : "not-allowed",
                    opacity: isFormComplete() ? 1 : 0.5,
                  }}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Agregar al carrito
                </Button>
              </Tooltip>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
