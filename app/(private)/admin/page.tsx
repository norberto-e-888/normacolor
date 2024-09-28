"use client";

import { useRef, useState } from "react";

import { createProduct } from "@/functions/products";
import { CreateProductData } from "@/functions/products/create-product";
import { FormButton } from "@/ui";

type ValidationErrors<T> = Partial<{
  [key in keyof T]: string[] | undefined;
}>;

export default function AdminHomePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] =
    useState<ValidationErrors<CreateProductData> | null>();

  const handleForm = async (formData: FormData) => {
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;

    const response = await createProduct({
      name,
      price: Number(price),
    });

    if (response.ok) {
      setErrors(null);

      if (formRef.current) {
        formRef.current.reset();
      }
    } else if (response.message) {
      alert(response.message);
    } else if (response.errors) {
      setErrors(response.errors);
    }
  };

  return (
    <main className="m-8">
      <form
        ref={formRef}
        action={handleForm}
        className="flex flex-col gap-4 flex-ga w-48"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="name">Nombre</label>
          <input
            className="border-2"
            type="text"
            name="name"
            id="name"
            autoComplete="off"
          />
          {errors?.name && <p className="text-red-600 ml-1">{errors.name}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="price">Precio</label>
          <input className="border-2" type="number" name="price" id="price" />
          {errors?.price && <p className="text-red-600 ml-1">{errors.price}</p>}
        </div>
        <FormButton settledText="Crear" pendingText="Creando..." />
      </form>
    </main>
  );
}
