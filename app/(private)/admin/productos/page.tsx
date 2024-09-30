/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";

import { SubmitButton } from "@/components/smart";
import { Product } from "@/database";
import {
  createProduct,
  CreateProductData,
  fetchProducts,
} from "@/functions/products";
import { formatCents } from "@/utils";

type ValidationErrors<T> = Partial<{
  [key in keyof T]: string[] | undefined;
}>;

export default function AdminHomePage() {
  const [products, setProducts] = useState<Product[]>([]);
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

    if (response.ok && response.data) {
      setErrors(null);
      setProducts((current) => [response.data?.product, ...current]);

      if (formRef.current) {
        formRef.current.reset();
      }
    } else if (response.message) {
      alert(response.message);
    } else if (response.errors) {
      setErrors(response.errors);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const response = await fetchProducts();

      if (response.data) {
        setProducts(response.data.products);
      }
    };

    fetch();
  }, []);

  return (
    <div>
      {/*  <form
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
        <SubmitButton text="Crear" pendingText="Creando..." />
      </form>
 */}
      {products.map(({ id, name, price }) => (
        <div key={id}>
          <p>Nombre: {name}</p>
          <p>Precio: {formatCents(price)}</p>
        </div>
      ))}
    </div>
  );
}
