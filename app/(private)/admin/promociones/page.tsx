"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { PromotionCarousel } from "@/components/smart/promotion-carousel";
import { PromotionDetail } from "@/components/smart/promotion-detail";
import { PromotionDrafts } from "@/components/smart/promotion-drafts";
import { PromotionFormModal } from "@/components/smart/promotion-form-modal";
import { PromotionHistory } from "@/components/smart/promotion-history";
import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
import { Promotion, PromotionStatus } from "@/database";

export default function AdminPromotionsPage() {
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const handleSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: ["promotions", PromotionStatus.Active],
    });
    queryClient.invalidateQueries({
      queryKey: ["promotions", PromotionStatus.Draft],
    });
    queryClient.invalidateQueries({
      queryKey: ["promotions", PromotionStatus.Ended],
    });
  };

  return (
    <Content>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Promociones</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Promoción
          </Button>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Activas</h2>
          <PromotionCarousel onPromotionSelect={setSelectedPromotion} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Borradores</h2>
          <PromotionDrafts onPromotionSelect={setSelectedPromotion} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Pasadas</h2>
          <PromotionHistory onPromotionSelect={setSelectedPromotion} />
        </section>

        {isCreateModalOpen && (
          <PromotionFormModal
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleSuccess}
          />
        )}

        <PromotionDetail
          promotion={selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
          onSuccess={handleSuccess}
        />
      </div>
    </Content>
  );
}
