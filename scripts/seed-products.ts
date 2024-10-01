import mongoose from "mongoose";

import {
  Product,
  ProductOptionFinish,
  ProductOptionPaper,
  ProductOptionSide,
} from "@/database";
import { BaseModel } from "@/utils";

const seed = async () => {
  const { connection } = await mongoose.connect(
    process.env.MONGODB_URI as string
  );

  if (!connection.db) {
    console.error("Connection DB not found");
    return;
  }

  const collection =
    connection.db.collection<Omit<Product, keyof BaseModel>>("products");

  await collection.insertMany([
    {
      name: "tarjetas de presentación",
      images: [],
      options: {
        sides: [ProductOptionSide.One, ProductOptionSide.Both],
        finish: [ProductOptionFinish.None, ProductOptionFinish.PlastifiedGloss],
        paper: [ProductOptionPaper.ThreeHundredGMatte],
        dimensions: [[3.5, 2]],
      },
      baseUnitPrice: 10,
      pricing: {
        sides: new Map()
          .set(ProductOptionSide.One, 1)
          .set(ProductOptionSide.Both, 1.8),
        finish: new Map()
          .set(ProductOptionFinish.None, 1)
          .set(ProductOptionFinish.PlastifiedGloss, 1.5),
        paper: new Map().set(ProductOptionPaper.ThreeHundredGMatte, 1),
        dimensions: new Map().set(JSON.stringify([3.5, 2]), 1),
      },
      isPublic: true,
    },
    {
      name: "postales",
      images: [],
      options: {
        sides: [ProductOptionSide.One, ProductOptionSide.Both],
        finish: [ProductOptionFinish.None],
        paper: [
          ProductOptionPaper.ThreeHundredGMatte,
          ProductOptionPaper.ThreeHundredGSatin,
        ],
        dimensions: [[4, 6]],
      },
      baseUnitPrice: 20,
      pricing: {
        sides: new Map()
          .set(ProductOptionSide.One, 1)
          .set(ProductOptionSide.Both, 1.7),
        finish: new Map().set(ProductOptionFinish.None, 1),
        paper: new Map()
          .set(ProductOptionPaper.ThreeHundredGMatte, 1)
          .set(ProductOptionPaper.ThreeHundredGSatin, 1),
        dimensions: new Map().set(JSON.stringify([4, 6]), 1),
      },
      isPublic: true,
    },
    {
      name: "carpetas",
      images: [],
      options: {
        sides: [ProductOptionSide.One],
        finish: [
          ProductOptionFinish.None,
          ProductOptionFinish.PlastifiedGloss,
          ProductOptionFinish.PlastifiedMatte,
          ProductOptionFinish.UVVarnishGloss,
        ],
        paper: [ProductOptionPaper.ThreeHundredGMatte],
        dimensions: [[9, 12]],
      },
      baseUnitPrice: 190,
      pricing: {
        sides: new Map().set(ProductOptionSide.One, 1),
        finish: new Map()
          .set(ProductOptionFinish.None, 1)
          .set(ProductOptionFinish.PlastifiedGloss, 1.3)
          .set(ProductOptionFinish.PlastifiedMatte, 1.3)
          .set(ProductOptionFinish.UVVarnishGloss, 1.1),
        paper: new Map().set(ProductOptionPaper.ThreeHundredGMatte, 1),
        dimensions: new Map().set(JSON.stringify([9, 12]), 1),
      },
      isPublic: true,
    },
    {
      name: "hojas membretes",
      images: [],
      options: {
        sides: [ProductOptionSide.One],
        finish: [ProductOptionFinish.None],
        paper: [ProductOptionPaper.Bond20lb],
        dimensions: [[8.5, 11]],
      },
      baseUnitPrice: 80,
      pricing: {
        sides: new Map().set(ProductOptionSide.One, 1),
        finish: new Map().set(ProductOptionFinish.None, 1),
        paper: new Map().set(ProductOptionPaper.Bond20lb, 1),
        dimensions: new Map().set(JSON.stringify([8.5, 11]), 1),
      },
      isPublic: true,
    },
    {
      name: "volantes",
      images: [],
      options: {
        sides: [ProductOptionSide.One, ProductOptionSide.Both],
        finish: [ProductOptionFinish.None],
        paper: [
          ProductOptionPaper.HundredFiftyGMatte,
          ProductOptionPaper.HundredThirtyLbMatte,
          ProductOptionPaper.HundredLbMatte,
          ProductOptionPaper.HundredLbSatin,
        ],
        dimensions: [
          [3.5, 8.5],
          [5.5, 8.5],
          [8.5, 11],
        ],
      },
      baseUnitPrice: 25,
      pricing: {
        sides: new Map()
          .set(ProductOptionSide.One, 1)
          .set(ProductOptionSide.Both, 1.8),
        finish: new Map().set(ProductOptionFinish.None, 1),
        paper: new Map()
          .set(ProductOptionPaper.HundredFiftyGMatte, 1)
          .set(ProductOptionPaper.HundredThirtyLbMatte, 1)
          .set(ProductOptionPaper.HundredLbMatte, 1)
          .set(ProductOptionPaper.HundredLbSatin, 1),
        dimensions: new Map()
          .set(JSON.stringify([3.5, 8.5]), 1)
          .set(JSON.stringify([5.5, 8.5]), 1.2)
          .set(JSON.stringify([8.5, 11]), 1.8),
      },
      isPublic: true,
    },
    {
      name: "afiches",
      images: [],
      options: {
        sides: [ProductOptionSide.One],
        finish: [ProductOptionFinish.None],
        paper: [
          ProductOptionPaper.HundredLbMatte,
          ProductOptionPaper.HundredLbSatin,
        ],
        dimensions: [[12, 18]],
      },
      baseUnitPrice: 90,
      pricing: {
        sides: new Map().set(ProductOptionSide.One, 1),
        finish: new Map().set(ProductOptionFinish.None, 1),
        paper: new Map()
          .set(ProductOptionPaper.HundredLbMatte, 1)
          .set(ProductOptionPaper.HundredLbSatin, 1),
        dimensions: new Map().set(JSON.stringify([12, 18]), 1),
      },
      isPublic: true,
    },
    {
      name: "plastificado",
      images: [],
      options: {
        sides: [ProductOptionSide.One, ProductOptionSide.Both],
        finish: [
          ProductOptionFinish.PlastifiedGloss,
          ProductOptionFinish.PlastifiedMatte,
        ],
        paper: [],
        dimensions: [[12, 18]],
      },
      baseUnitPrice: 45,
      pricing: {
        sides: new Map()
          .set(ProductOptionSide.One, 1)
          .set(ProductOptionSide.Both, 1.89),
        finish: new Map()
          .set(ProductOptionFinish.PlastifiedGloss, 1)
          .set(ProductOptionFinish.PlastifiedMatte, 1.12),
        paper: new Map(),
        dimensions: new Map().set(JSON.stringify([12, 18]), 1),
      },
      isPublic: true,
    },
    {
      name: "barniz uv",
      images: [],
      options: {
        sides: [ProductOptionSide.One, ProductOptionSide.Both],
        finish: [
          ProductOptionFinish.UVVarnishGloss,
          ProductOptionFinish.UVVarnishMatte,
        ],
        paper: [],
        dimensions: [[12, 18]],
      },
      baseUnitPrice: 15,
      pricing: {
        sides: new Map()
          .set(ProductOptionSide.One, 1)
          .set(ProductOptionSide.Both, 2),
        finish: new Map()
          .set(ProductOptionFinish.UVVarnishGloss, 1)
          .set(ProductOptionFinish.UVVarnishMatte, 1.34),
        paper: new Map(),
        dimensions: new Map().set(JSON.stringify([12, 18]), 1),
      },
      isPublic: true,
    },
  ]);
};

seed();
