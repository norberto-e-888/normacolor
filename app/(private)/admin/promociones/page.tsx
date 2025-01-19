"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { PromotionCarousel } from "@/components/smart/promotion-carousel";
import { PromotionDetail } from "@/components/smart/promotion-detail";
import { PromotionDrafts } from "@/components/smart/promotion-drafts";
import { PromotionHistory } from "@/components/smart/promotion-history";
import { Button } from "@/components/ui/button";
import { Content } from "@/components/ui/content";
import { Promotion } from "@/database";

export default function AdminPromotionsPage() {
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <Content>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Promociones</h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva
          </Button>
        </div>

        {/* Active Promotions Carousel */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Activas</h2>
          <PromotionCarousel onPromotionSelect={setSelectedPromotion} />
        </section>

        {/* Draft Promotions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Borradores</h2>
          <PromotionDrafts onPromotionSelect={setSelectedPromotion} />
        </section>

        {/* Promotion History */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Historial</h2>
          <PromotionHistory onPromotionSelect={setSelectedPromotion} />
        </section>

        {/* Create/Edit Modal */}
        {isCreateModalOpen && <div>Modal placeholder</div>}

        {/* Detail Sidebar */}
        <PromotionDetail
          promotion={selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
        />
      </div>
    </Content>
  );
}
