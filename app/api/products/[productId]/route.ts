import { NextResponse } from "next/server";
import { z } from "zod";

import {
  Product,
  ProductOptionFinish,
  ProductOptionPaper,
  ProductOptionSide,
} from "@/database";
import { getServerSession } from "@/functions/auth";
import { connectToMongo } from "@/lib/server";

const updateProductSchema = z
  .object({
    name: z.string().min(3).optional(),
    isPublic: z.boolean().optional(),
    pricing: z
      .object({
        baseUnitPrice: z.number().min(1),
        minimumPurchase: z.number().min(1),
        optionMultipliers: z
          .object({
            sides: z
              .record(
                z.enum([
                  ProductOptionSide.One,
                  ProductOptionSide.Both,
                  ProductOptionSide.Diptic,
                  ProductOptionSide.Triptic,
                ]),
                z.number()
              )
              .optional(),
            finish: z
              .record(
                z.enum([
                  ProductOptionFinish.PlastifiedGloss,
                  ProductOptionFinish.PlastifiedMatte,
                  ProductOptionFinish.UVVarnishGloss,
                  ProductOptionFinish.UVVarnishMatte,
                  ProductOptionFinish.None,
                ]),
                z.number()
              )
              .optional(),
            paper: z
              .record(
                z.enum([
                  ProductOptionPaper.HundredLbMatte,
                  ProductOptionPaper.HundredLbSatin,
                  ProductOptionPaper.HundredThirtyLbMatte,
                  ProductOptionPaper.HundredThirtyLbSatin,
                  ProductOptionPaper.ThreeHundredGMatte,
                  ProductOptionPaper.ThreeHundredGSatin,
                  ProductOptionPaper.HundredFiftyGMatte,
                  ProductOptionPaper.HundredFiftyGSatin,
                  ProductOptionPaper.Chemical,
                  ProductOptionPaper.Bond,
                  ProductOptionPaper.Bond20lb,
                ]),
                z.number()
              )
              .optional(),
            dimensions: z.record(z.string(), z.number()).optional(),
          })
          .optional(),
        quantityDiscountMultipliers: z
          .array(z.tuple([z.number(), z.number()]))
          .optional(),
      })
      .optional(),
  })
  .strict();

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const session = await getServerSession();
  if (!session || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const result = await updateProductSchema.safeParseAsync(json);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  await connectToMongo();
  const product = await Product.findByIdAndUpdate(
    params.productId,
    { $set: result.data },
    { new: true }
  );

  if (!product) {
    return new NextResponse("Product not found", { status: 404 });
  }

  return NextResponse.json({ product: product.toObject() });
}

export async function DELETE(
  _: Request,
  { params }: { params: { productId: string } }
) {
  const session = await getServerSession();
  if (
    !session ||
    session.user.role !== "admin" ||
    session.user.email !== process.env.ROOT_USER_EMAIL
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  await connectToMongo();
  const product = await Product.findByIdAndDelete(params.productId);

  if (!product) {
    return new NextResponse("Product not found", { status: 404 });
  }

  return NextResponse.json({ success: true });
}
