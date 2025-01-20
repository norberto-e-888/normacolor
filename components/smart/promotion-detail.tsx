"use client";

import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Promotion, PromotionStatus } from "@/database";

interface PromotionDetailProps {
  promotion: Promotion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromotionDetail({
  promotion,
  onClose,
  onSuccess,
}: PromotionDetailProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async () => {
    if (!promotion) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/promotions/${promotion.id}/activate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to activate promotion");

      toast.success("Promoción activada exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error activating promotion:", error);
      toast.error("Error al activar la promoción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!promotion) return;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/promotions/${promotion.id}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel promotion");

      toast.success("Promoción cancelada exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error canceling promotion:", error);
      toast.error("Error al cancelar la promoción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!promotion) return;
    if (!confirm("¿Estás seguro de que deseas eliminar esta promoción?"))
      return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/promotions/${promotion.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete promotion");

      toast.success("Promoción eliminada exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      toast.error("Error al eliminar la promoción");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (promotion) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [promotion, onClose]);

  if (!promotion) return null;

  return (
    <Modal isOpen={!!promotion} onClose={onClose}>
      <div className="w-[600px] max-w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Detalles de la Promoción</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Basic Information
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Name:</span> {promotion.name}
                </p>
                <p>
                  <span className="font-medium">Description:</span>{" "}
                  {promotion.description}
                </p>
                <p>
                  <span className="font-medium">Type:</span>{" "}
                  {promotion.type.replace(/_/g, " ")}
                </p>
                <p>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      promotion.status === "active"
                        ? "bg-green-100 text-green-800"
                        : promotion.status === "draft"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {promotion.status}
                  </span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Dates
              </h3>
              <div className="space-y-2">
                {promotion.startDate && (
                  <p>
                    <span className="font-medium">Start Date:</span>{" "}
                    {format(new Date(promotion.startDate), "PPP")}
                  </p>
                )}
                {promotion.endDate && (
                  <p>
                    <span className="font-medium">End Date:</span>{" "}
                    {format(new Date(promotion.endDate), "PPP")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Points & Redemptions
              </h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Points Cost:</span>{" "}
                  {promotion.pointsCost}
                </p>
                <p>
                  <span className="font-medium">Redemptions:</span>{" "}
                  {promotion.currentRedemptions}
                  {promotion.maxRedemptions
                    ? ` / ${promotion.maxRedemptions}`
                    : " (unlimited)"}
                </p>
              </div>
            </div>

            {promotion.conditions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Conditions
                </h3>
                <ul className="space-y-2">
                  {promotion.conditions.map((condition, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {condition.type.replace(/_/g, " ")}:
                      </span>
                      <span>
                        {Array.isArray(condition.value)
                          ? condition.value.join(", ")
                          : condition.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Rewards
              </h3>
              <ul className="space-y-2">
                {promotion.rewards.map((reward, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {reward.type.replace(/_/g, " ")}:
                    </span>
                    <span>{reward.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          {promotion.status === PromotionStatus.Draft && (
            <>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Borrar"
                )}
              </Button>
              <Button onClick={handleActivate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Activar"
                )}
              </Button>
            </>
          )}
          {promotion.status === PromotionStatus.Active && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancelar"
              )}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
