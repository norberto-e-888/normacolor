import { Product } from "@/database";

const seed = async () => {
  await Product.insertMany([
    {
      name: "tarjetas de presentación",
      images: [],
      options: {
        sides: ["one", "both"],
        finish: ["none", "plastifiedgloss"],
        paper: ["300gmatte"],
        dimensions: [[3.5, 2]],
      },
      baseUnitPrice: 10,
      pricing: {
        sides: new Map().set("one", 1).set("both", 1.8),
        finish: new Map().set("none", 1).set("plastifiedgloss", 1.5),
        paper: new Map().set("300gmatte", 1),
        dimensions: new Map().set(JSON.stringify([3.5, 2]), 1),
      },
      isPublic: false,
    },
    {
      name: "postales",
      images: [],
      options: {
        sides: ["one", "both"],
        finish: ["none"],
        paper: ["300gmatte", "300gsatin"],
        dimensions: [[4, 6]],
      },
      baseUnitPrice: 20,
      pricing: {
        sides: new Map().set("one", 1).set("both", 1.7),
        finish: new Map().set("none", 1),
        paper: new Map().set("300gmatte", 1, "300gsatin", 1),
        dimensions: new Map().set(JSON.stringify([4, 6]), 1),
      },
    },
    {
      name: "carpetas",
      images: [],
      options: {
        sides: ["one"],
        finish: ["none", "plastifiedgloss", "plastifiedmatte", "uvvarnish"],
        paper: ["300gmatte"],
        dimensions: [[9, 12]],
      },
      baseUnitPrice: 190,
      pricing: {
        sides: new Map().set("one", 1),
        finish: new Map()
          .set("none", 1)
          .set("plastifiedgloss", 1.3)
          .set("plastifiedmatte", 1.3)
          .set("uvvarnish", 1.1),
        paper: new Map().set("300gmatte", 1),
        dimensions: new Map().set(JSON.stringify([9, 12]), 1),
      },
    },
  ]);
};

seed();
