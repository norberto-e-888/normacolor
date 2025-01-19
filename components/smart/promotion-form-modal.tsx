"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Promotion,
  PromotionConditionType,
  PromotionRewardType,
  PromotionStatus,
  PromotionTrigger,
  PromotionType,
  VALID_TYPE_CONDITION_COMBINATIONS,
  VALID_TYPE_REWARD_COMBINATIONS,
} from "@/database";
// components/smart/promotions/promotion-form-modal.tsx
// Import the base schema
import { basePromotionSchema } from "@/database";
import { cn } from "@/lib/client";
import {
  conditionTypeLabels,
  promotionStatusLabels,
  promotionTriggerLabels,
  promotionTypeLabels,
  rewardTypeLabels,
} from "@/utils/promotion-translations";

// Extend the base schema with form-specific refinements
const formSchema = basePromotionSchema
  .extend({
    // Add any form-specific fields or overrides here
  })
  .refine(
    (data) => {
      // Validate that all conditions are valid for the promotion type
      const validConditionTypes = VALID_TYPE_CONDITION_COMBINATIONS[data.type];
      return data.conditions.every((condition) =>
        validConditionTypes.includes(condition.type)
      );
    },
    {
      message: "Tipo de condición inválido para este tipo de promoción",
      path: ["conditions"],
    }
  )
  .refine(
    (data) => {
      // Validate that all rewards are valid for the promotion type
      const validRewardTypes = VALID_TYPE_REWARD_COMBINATIONS[data.type];
      return data.rewards.every((reward) =>
        validRewardTypes.includes(reward.type)
      );
    },
    {
      message: "Tipo de recompensa inválido para este tipo de promoción",
      path: ["rewards"],
    }
  )
  .refine(
    (data) => {
      // Validate reward values based on their type
      return data.rewards.every((reward) => {
        switch (reward.type) {
          case "discount_percentage":
            return (
              typeof reward.value === "number" &&
              reward.value > 0 &&
              reward.value <= 100
            );
          case "bonus_points":
            return typeof reward.value === "number" && reward.value > 0;
          case "free_product":
            return typeof reward.value === "string" && reward.value.length > 0;
          case "tier_upgrade":
            return (
              typeof reward.value === "string" &&
              ["silver", "gold", "platinum"].includes(reward.value)
            );
          default:
            return false;
        }
      });
    },
    {
      message: "Valor de recompensa inválido para el tipo especificado",
      path: ["rewards"],
    }
  )
  .refine(
    (data) => {
      // Validate condition values based on their type
      return data.conditions.every((condition) => {
        switch (condition.type) {
          case "min_order_value":
          case "min_order_count":
          case "order_streak":
            return typeof condition.value === "number" && condition.value > 0;
          case "specific_products":
            return (
              Array.isArray(condition.value) &&
              condition.value.every(
                (id) => typeof id === "string" && id.length > 0
              )
            );
          default:
            return false;
        }
      });
    },
    {
      message: "Valor de condición inválido para el tipo especificado",
      path: ["conditions"],
    }
  )
  .refine(
    (data) => {
      // Validate dates if both are provided
      if (data.startDate && data.endDate) {
        return data.startDate < data.endDate;
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la fecha de inicio",
      path: ["endDate"],
    }
  );

type FormData = z.infer<typeof formSchema>;

// Rest of the file remains the same...

interface PromotionFormModalProps {
  promotion?: Promotion;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromotionFormModal({
  promotion,
  onClose,
  onSuccess,
}: PromotionFormModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: PromotionType.PointsDiscount,
      status: PromotionStatus.Draft,
      trigger: PromotionTrigger.Manual,
      pointsCost: 0,
      conditions: [],
      rewards: [
        {
          type: PromotionRewardType.DiscountPercentage,
          value: 10,
        },
      ],
      metadata: {},
    },
  });

  useEffect(() => {
    if (promotion) {
      form.reset({
        ...promotion,
        startDate: promotion.startDate
          ? new Date(promotion.startDate)
          : undefined,
        endDate: promotion.endDate ? new Date(promotion.endDate) : undefined,
      });
    }
  }, [promotion, form]);

  useEffect(() => {
    const type = form.watch("type");
    const conditions = form.watch("conditions");
    const rewards = form.watch("rewards");

    // Reset conditions if any are invalid for new type
    const validConditionTypes = VALID_TYPE_CONDITION_COMBINATIONS[type];
    const hasInvalidConditions = conditions.some(
      (condition) => !validConditionTypes.includes(condition.type)
    );

    if (hasInvalidConditions) {
      form.setValue("conditions", []);
    }

    // Reset rewards if any are invalid for new type
    const validRewardTypes = VALID_TYPE_REWARD_COMBINATIONS[type];
    const hasInvalidRewards = rewards.some(
      (reward) => !validRewardTypes.includes(reward.type)
    );

    if (hasInvalidRewards) {
      form.setValue("rewards", [
        {
          type: validRewardTypes[0],
          value: validRewardTypes[0] === "discount_percentage" ? 10 : 0,
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("type")]);

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch("/api/promotions", {
        method: promotion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(promotion ? { ...data, id: promotion.id } : data),
      });

      if (!response.ok) {
        throw new Error("Failed to save promotion");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving promotion:", error);
    }
  };

  const availableRewardTypes = useMemo(() => {
    const promotionType = form.watch("type");
    return Object.entries(rewardTypeLabels).filter(([value]) =>
      VALID_TYPE_REWARD_COMBINATIONS[promotionType].includes(
        value as PromotionRewardType
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("type")]);

  const availableConditionTypes = useMemo(() => {
    const promotionType = form.watch("type");
    return Object.entries(conditionTypeLabels).filter(([value]) =>
      VALID_TYPE_CONDITION_COMBINATIONS[promotionType].includes(
        value as PromotionConditionType
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("type")]);

  return (
    <Modal isOpen onClose={onClose}>
      <div className="p-6 w-[600px] max-w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {promotion ? "Editar Promoción" : "Nueva Promoción"}
        </h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre de la promoción" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe la promoción" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(promotionTypeLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trigger"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activación</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la activación" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(promotionTriggerLabels).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de inicio</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() ||
                            !!(
                              form.watch("endDate") &&
                              date > (form.watch("endDate") as unknown as Date)
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() ||
                            !!(
                              form.watch("startDate") &&
                              date <
                                (form.watch("startDate") as unknown as Date)
                            )
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pointsCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo en puntos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxRedemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de canjes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        placeholder="Sin límite"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(promotionStatusLabels).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Condiciones</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const conditions = form.getValues("conditions");
                    form.setValue("conditions", [
                      ...conditions,
                      {
                        type: PromotionConditionType.MinOrderValue,
                        value: 0,
                      },
                    ]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Condición
                </Button>
              </div>
              {form.watch("conditions").map((_, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`conditions.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de condición" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableConditionTypes.map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`conditions.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            placeholder="Valor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-center"
                    onClick={() => {
                      const conditions = form.getValues("conditions");
                      form.setValue(
                        "conditions",
                        conditions.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Rewards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Recompensas</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const rewards = form.getValues("rewards");
                    form.setValue("rewards", [
                      ...rewards,
                      {
                        type: PromotionRewardType.DiscountPercentage,
                        value: 0,
                      },
                    ]);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Recompensa
                </Button>
              </div>
              {form.watch("rewards").map((_, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`rewards.${index}.type`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de recompensa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableRewardTypes.map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`rewards.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            placeholder="Valor"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-center"
                    disabled={index === 0} // Prevent removing the last reward
                    onClick={() => {
                      const rewards = form.getValues("rewards");
                      form.setValue(
                        "rewards",
                        rewards.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : promotion ? (
                  "Actualizar"
                ) : (
                  "Crear"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Modal>
  );
}
