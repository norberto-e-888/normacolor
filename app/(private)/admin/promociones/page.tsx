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
import { Promotion } from "@/database";

export default function AdminPromotionsPage() {
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["active-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["draft-promotions"] });
    queryClient.invalidateQueries({ queryKey: ["ended-promotions"] });
  };

  return (
    <Content>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Promotions</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Promotion
          </Button>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-4">Active Promotions</h2>
          <PromotionCarousel onPromotionSelect={setSelectedPromotion} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Draft Promotions</h2>
          <PromotionDrafts onPromotionSelect={setSelectedPromotion} />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Promotion History</h2>
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
        />
      </div>
    </Content>
  );
}
