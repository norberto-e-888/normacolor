"use client";

import { Package } from "lucide-react";

import { Order } from "@/database";
import { formatCents } from "@/utils";

interface OrderListItemProps {
  order: Order<true>;
  isSelected: boolean;
  justPaid?: boolean;
  onClick: (order: Order<true>) => void;
}

export function OrderListItem({
  order,
  isSelected,
  justPaid,
  onClick,
}: OrderListItemProps) {
  return (
    <div
      className={`
        cursor-pointer p-4 rounded-lg border transition-colors
        ${
          justPaid
            ? "border-green-500 bg-green-50"
            : isSelected
            ? "border-primary bg-primary/5"
            : "hover:border-primary/50"
        }
      `}
      onClick={() => onClick(order)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Orden #{order.id.slice(-8)}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatCents(order.total)}</span>
        </div>
      </div>
    </div>
  );
}
