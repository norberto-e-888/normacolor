"use client";

import { format } from "date-fns";
import { X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Promotion } from "@/database";

interface PromotionDetailProps {
  promotion: Promotion | null;
  onClose: () => void;
}

export function PromotionDetail({ promotion, onClose }: PromotionDetailProps) {
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
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg transform transition-transform duration-200 ease-in-out">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Promotion Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Basic Info */}
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

            {/* Dates */}
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

            {/* Points & Redemptions */}
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

            {/* Conditions */}
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

            {/* Rewards */}
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
      </div>
    </div>
  );
}
