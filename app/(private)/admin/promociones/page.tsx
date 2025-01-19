import { Gift } from "lucide-react";

import { Content } from "@/components/ui/content";

export default function AdminPromotionsPage() {
  return (
    <Content title="Promociones">
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-muted-foreground">
        <Gift className="w-12 h-12" />
        <p className="text-lg">Pronto...</p>
        <p className="text-sm">
          Crea y administra promociones y recompensas de puntos de lealtad
        </p>
      </div>
    </Content>
  );
}
