"use client";

import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TRANSLATIONS } from "@/constants/translations";
import { Product, ProductTemplate } from "@/database";

const formatOptionLabel = (option: string) => {
  return option
    .replace(/([A-Z])/g, " $1")
    .toLowerCase()
    .replace(/^./, (str) => str.toUpperCase());
};

interface ProductTemplateFormProps {
  product: Product<true>;
  onSave: (updatedProduct: Product<true>) => Promise<void>;
}

export function ProductTemplateForm({
  product,
  onSave,
}: ProductTemplateFormProps) {
  const [templates, setTemplates] = useState<ProductTemplate[]>(
    product.templates || []
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState<ProductTemplate>({
    id: "",
    name: "",
    options: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const createNewTemplate = () => {
    setIsCreating(true);
    setNewTemplate({
      id: uuidv4(),
      name: "",
      options: {},
    });
  };

  const cancelCreating = () => {
    setIsCreating(false);
    setNewTemplate({
      id: "",
      name: "",
      options: {},
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "name") {
      setNewTemplate((prev) => ({
        ...prev,
        name: value,
      }));
    } else {
      setNewTemplate((prev) => ({
        ...prev,
        options: {
          ...prev.options,
          [name]: name === "dimensions" ? JSON.parse(value) : value,
        },
      }));
    }
  };

  const addTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast.error("El nombre de la plantilla es requerido", {
        closeButton: true,
      });
      return;
    }

    setTemplates((prev) => [...prev, newTemplate]);
    setIsCreating(false);
    setNewTemplate({
      id: "",
      name: "",
      options: {},
    });
  };

  const removeTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id));
  };

  const saveTemplates = async () => {
    setIsLoading(true);
    try {
      const updatedProduct = {
        ...product,
        templates,
      };
      await onSave(updatedProduct);
      toast.success("Plantillas guardadas correctamente", {
        closeButton: true,
      });
    } catch (error) {
      toast.error("Error al guardar las plantillas", {
        closeButton: true,
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Opciones Estándar</h2>
        <Button
          onClick={createNewTemplate}
          disabled={isCreating}
          variant="outline"
        >
          Añadir Opción
        </Button>
      </div>

      {templates.length === 0 && !isCreating && (
        <div className="text-center py-8 text-muted-foreground">
          No hay opciones estándar. Añade una nueva opción.
        </div>
      )}

      {templates.map((template) => (
        <div key={template.id} className="border rounded-md p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{template.name}</h3>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeTemplate(template.id)}
            >
              Eliminar
            </Button>
          </div>
          <div className="text-sm space-y-1 text-muted-foreground">
            {template.options.sides && (
              <div>Lados: {TRANSLATIONS[template.options.sides]}</div>
            )}
            {template.options.paper && (
              <div>Papel: {formatOptionLabel(template.options.paper)}</div>
            )}
            {template.options.finish && (
              <div>Acabado: {formatOptionLabel(template.options.finish)}</div>
            )}
            {template.options.dimensions && (
              <div>
                Dimensiones: {template.options.dimensions[0]}&quot; x{" "}
                {template.options.dimensions[1]}&quot;
              </div>
            )}
          </div>
        </div>
      ))}

      {isCreating && (
        <div className="border rounded-md p-4 space-y-4">
          <h3 className="font-medium">Nueva opción estándar</h3>
          <div>
            <label className="block text-sm font-bold mb-1">Nombre</label>
            <Input
              name="name"
              value={newTemplate.name}
              onChange={handleInputChange}
              placeholder="Ej: Estándar, Premium, Básico"
            />
          </div>

          {!!product.options.sides?.length && (
            <div>
              <label className="block text-sm font-bold mb-1">Lados</label>
              <select
                name="sides"
                className="w-full border rounded-md p-2"
                value={newTemplate.options.sides || ""}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar</option>
                {product.options.sides.map((side) => (
                  <option key={side} value={side}>
                    {TRANSLATIONS[side]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!!product.options.paper?.length && (
            <div>
              <label className="block text-sm font-bold mb-1">Papel</label>
              <select
                name="paper"
                className="w-full border rounded-md p-2"
                value={newTemplate.options.paper || ""}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar</option>
                {product.options.paper.map((paper) => (
                  <option key={paper} value={paper}>
                    {formatOptionLabel(paper)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!!product.options.finish?.length && (
            <div>
              <label className="block text-sm font-bold mb-1">Acabado</label>
              <select
                name="finish"
                className="w-full border rounded-md p-2"
                value={newTemplate.options.finish || ""}
                onChange={handleInputChange}
              >
                <option value="">Seleccionar</option>
                {product.options.finish.map((finish) => (
                  <option key={finish} value={finish}>
                    {formatOptionLabel(finish)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!!product.options.dimensions?.length && (
            <div>
              <label className="block text-sm font-bold mb-1">
                Dimensiones
              </label>
              <select
                name="dimensions"
                className="w-full border rounded-md p-2"
                value={
                  newTemplate.options.dimensions
                    ? JSON.stringify(newTemplate.options.dimensions)
                    : ""
                }
                onChange={handleInputChange}
              >
                <option value="">Seleccionar</option>
                {product.options.dimensions.map((dim) => (
                  <option key={dim.join("x")} value={JSON.stringify(dim)}>
                    {dim[0]}&quot; x {dim[1]}&quot;
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={cancelCreating}>
              Cancelar
            </Button>
            <Button onClick={addTemplate}>Añadir</Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={saveTemplates} disabled={isLoading} className="mt-4">
          {isLoading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </div>
  );
}
