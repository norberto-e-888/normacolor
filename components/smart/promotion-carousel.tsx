"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { Promotion, PromotionStatus } from "@/database";

interface PromotionCarouselProps {
  onPromotionSelect: (promotion: Promotion) => void;
}

export function PromotionCarousel({
  onPromotionSelect,
}: PromotionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { data: promotions = [] } = useQuery<Promotion[]>({
    queryKey: ["active-promotions"],
    queryFn: async () => {
      const response = await fetch(
        "/api/promotions?status=" + PromotionStatus.Active
      );
      if (!response.ok) throw new Error("Failed to fetch promotions");
      return response.json();
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging && promotions.length > 1) {
        setActiveIndex((current) => (current + 1) % promotions.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isDragging, promotions.length]);

  if (promotions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground border rounded-lg">
        No active promotions
      </div>
    );
  }

  return (
    <div className="relative h-64 perspective-1000">
      <div className="absolute inset-0 flex items-center justify-center">
        {promotions.map((promotion, index) => {
          const offset =
            (index - activeIndex + promotions.length) % promotions.length;
          const isActive = offset === 0;
          const isNext = offset === 1;
          const isPrev = offset === promotions.length - 1;

          return (
            <motion.div
              key={promotion.id}
              className="absolute w-full max-w-xl bg-card rounded-lg shadow-lg cursor-pointer"
              style={{
                height: "14rem",
                transformStyle: "preserve-3d",
              }}
              animate={{
                x: isActive ? 0 : isNext ? "60%" : isPrev ? "-60%" : 0,
                scale: isActive ? 1 : 0.8,
                rotateY: isActive ? 0 : isNext ? 45 : isPrev ? -45 : 0,
                zIndex: isActive ? 1 : 0,
                opacity: isActive ? 1 : 0.6,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={(_, info) => {
                setIsDragging(false);
                if (Math.abs(info.offset.x) > 100) {
                  if (info.offset.x > 0) {
                    setActiveIndex(
                      (current) =>
                        (current - 1 + promotions.length) % promotions.length
                    );
                  } else {
                    setActiveIndex(
                      (current) => (current + 1) % promotions.length
                    );
                  }
                }
              }}
              onClick={() => isActive && onPromotionSelect(promotion)}
            >
              <div className="p-6 h-full">
                <div
                  className="absolute inset-0 rounded-lg opacity-10"
                  style={{
                    backgroundColor:
                      promotion.metadata.highlightColor ||
                      "hsl(var(--primary))",
                  }}
                />
                <div className="relative h-full flex flex-col">
                  <h3 className="text-xl font-bold mb-2">{promotion.name}</h3>
                  <p className="text-muted-foreground line-clamp-2 mb-4">
                    {promotion.description}
                  </p>
                  <div className="mt-auto flex justify-between items-end">
                    <div className="text-sm">
                      <span className="font-medium">
                        {promotion.pointsCost}
                      </span>
                      <span className="text-muted-foreground ml-1">points</span>
                    </div>
                    {promotion.maxRedemptions && (
                      <div className="text-sm text-muted-foreground">
                        {promotion.currentRedemptions}/
                        {promotion.maxRedemptions} claimed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
