import {
  PromotionConditionType,
  PromotionRewardType,
  PromotionStatus,
  PromotionTrigger,
  PromotionType,
} from "@/database";

export const promotionTypeLabels: Record<PromotionType, string> = {
  [PromotionType.PointsDiscount]: "Descuento por puntos",
  [PromotionType.PointsProduct]: "Producto por puntos",
  [PromotionType.PointsChallenge]: "Desafío de puntos",
  [PromotionType.LimitedTimeOffer]: "Oferta por tiempo limitado",
  [PromotionType.TierUnlock]: "Desbloqueo de nivel",
  [PromotionType.Streak]: "Racha de compras",
  [PromotionType.Seasonal]: "Oferta de temporada",
  [PromotionType.Referral]: "Referidos",
};

export const promotionStatusLabels: Record<PromotionStatus, string> = {
  [PromotionStatus.Draft]: "Borrador",
  [PromotionStatus.Active]: "Activa",
  [PromotionStatus.Paused]: "Pausada",
  [PromotionStatus.Ended]: "Finalizada",
};

export const promotionTriggerLabels: Record<PromotionTrigger, string> = {
  [PromotionTrigger.Manual]: "Manual",
  [PromotionTrigger.Automatic]: "Automático",
  [PromotionTrigger.Scheduled]: "Programado",
};

export const conditionTypeLabels: Record<PromotionConditionType, string> = {
  [PromotionConditionType.MinOrderValue]: "Valor mínimo de orden",
  [PromotionConditionType.MinOrderCount]: "Cantidad mínima de órdenes",
  [PromotionConditionType.SpecificProducts]: "Productos específicos",
  [PromotionConditionType.OrderStreak]: "Racha de órdenes",
};

export const rewardTypeLabels: Record<PromotionRewardType, string> = {
  [PromotionRewardType.DiscountPercentage]: "Porcentaje de descuento",
  [PromotionRewardType.BonusPoints]: "Puntos extra",
  [PromotionRewardType.FreeProduct]: "Producto gratis",
  [PromotionRewardType.TierUpgrade]: "Mejora de nivel",
};
