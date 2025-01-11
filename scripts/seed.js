/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { exit } = require("process");

const seed = async () => {
  const { connection } = await mongoose.connect(
    "mongodb://localhost:1000/normacolor?directConnection=true"
  );

  if (!connection.db) {
    console.error("Connection DB not found");
    return;
  }

  const collection = connection.db.collection("products");

  await collection.deleteMany();
  await collection.insertMany([
    {
      name: "tarjetas de presentación",
      images: [],
      options: {
        sides: ["one", "both"],
        finish: ["plastifiedgloss"],
        paper: ["300gmatte"],
        dimensions: [[3.5, 2]],
      },
      pricing: {
        baseUnitPrice: 10,
        optionMultipliers: {
          sides: new Map().set("one", 1).set("both", 1.8),
          finish: new Map().set("plastifiedgloss", 1.5),
          paper: new Map().set("300gmatte", 1),
          dimensions: new Map().set(JSON.stringify([3.5, 2]), 1),
        },
        quantityDiscountMultipliers: [
          [1000, 0.8],
          [500, 0.85],
          [100, 0.9],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "postales",
      images: [],
      options: {
        sides: ["one", "both"],
        paper: ["300gmatte", "300gsatin"],
        dimensions: [[4, 6]],
      },
      pricing: {
        baseUnitPrice: 20,
        optionMultipliers: {
          sides: new Map().set("one", 1).set("both", 1.7),
          paper: new Map().set("300gmatte", 1).set("300gsatin", 1.1),
          dimensions: new Map().set(JSON.stringify([4, 6]), 1),
        },
        quantityDiscountMultipliers: [
          [500, 0.8],
          [200, 0.9],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "carpetas",
      images: [],
      options: {
        sides: ["one"],
        finish: ["plastifiedgloss", "plastifiedmatte", "uvvarnishgloss"],
        paper: ["300gmatte"],
        dimensions: [[9, 12]],
      },
      pricing: {
        baseUnitPrice: 190,
        optionMultipliers: {
          sides: new Map().set("one", 1),
          finish: new Map()
            .set("plastifiedgloss", 1.3)
            .set("plastifiedmatte", 1.3)
            .set("uvvarnishgloss", 1.1),
          paper: new Map().set("300gmatte", 1),
          dimensions: new Map().set(JSON.stringify([9, 12]), 1),
        },
        quantityDiscountMultipliers: [
          [100, 0.85],
          [50, 0.9],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "hojas membretes",
      images: [],
      options: {
        sides: ["one"],
        paper: ["bond20lb"],
        dimensions: [[8.5, 11]],
      },
      pricing: {
        baseUnitPrice: 80,
        optionMultipliers: {
          sides: new Map().set("one", 1),
          paper: new Map().set("bond20lb", 1),
          dimensions: new Map().set(JSON.stringify([8.5, 11]), 1),
        },
        quantityDiscountMultipliers: [
          [1000, 0.8],
          [500, 0.85],
          [100, 0.9],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "volantes",
      images: [],
      options: {
        sides: ["one", "both"],
        paper: ["150gmatte", "130lbmatte", "100lbmatte", "100lbsatin"],
        dimensions: [
          [3.5, 8.5],
          [5.5, 8.5],
          [8.5, 11],
        ],
      },
      pricing: {
        baseUnitPrice: 25,
        optionMultipliers: {
          sides: new Map().set("one", 1).set("both", 1.8),
          paper: new Map()
            .set("150gmatte", 1.2)
            .set("130lbmatte", 1.1)
            .set("100lbmatte", 1)
            .set("100lbsatin", 1.1),
          dimensions: new Map()
            .set(JSON.stringify([3.5, 8.5]), 1)
            .set(JSON.stringify([5.5, 8.5]), 1.2)
            .set(JSON.stringify([8.5, 11]), 1.8),
        },
        quantityDiscountMultipliers: [
          [5000, 0.7],
          [2500, 0.75],
          [1000, 0.8],
          [500, 0.85],
          [100, 0.9],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "afiches",
      images: [],
      options: {
        sides: ["one"],
        paper: ["100lbmatte", "100lbsatin"],
        dimensions: [[12, 18]],
      },
      pricing: {
        baseUnitPrice: 90,
        optionMultipliers: {
          sides: new Map().set("one", 1),
          paper: new Map().set("100lbmatte", 1).set("100lbsatin", 1.1),
          dimensions: new Map().set(JSON.stringify([12, 18]), 1),
        },
        quantityDiscountMultipliers: [
          [100, 0.8],
          [50, 0.9],
          [25, 0.95],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "plastificado",
      images: [],
      options: {
        sides: ["one", "both"],
        finish: ["plastifiedgloss", "plastifiedmatte"],
        dimensions: [[12, 18]],
      },
      pricing: {
        baseUnitPrice: 45,
        optionMultipliers: {
          sides: new Map().set("one", 1).set("both", 1.89),
          finish: new Map()
            .set("plastifiedgloss", 1)
            .set("plastifiedmatte", 1.12),
          dimensions: new Map().set(JSON.stringify([12, 18]), 1),
        },
        quantityDiscountMultipliers: [
          [100, 0.85],
          [50, 0.9],
          [25, 0.95],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "barniz uv",
      images: [],
      options: {
        sides: ["one", "both"],
        finish: ["uvvarnishgloss", "uvvarnishmatte"],
        dimensions: [[12, 18]],
      },
      pricing: {
        baseUnitPrice: 15,
        optionMultipliers: {
          sides: new Map().set("one", 1).set("both", 2),
          finish: new Map()
            .set("uvvarnishgloss", 1)
            .set("uvvarnishmatte", 1.34),
          dimensions: new Map().set(JSON.stringify([12, 18]), 1),
        },
        quantityDiscountMultipliers: [
          [100, 0.85],
          [50, 0.9],
          [25, 0.95],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "brochures",
      images: [],
      options: {
        sides: ["diptic", "triptic"],
        paper: ["100lbmatte", "100lbsatin", "130lbmatte", "130lbsatin"],
        dimensions: [[11, 8.5]],
      },
      pricing: {
        baseUnitPrice: 110,
        optionMultipliers: {
          sides: new Map().set("diptic", 1).set("triptic", 1.5),
          paper: new Map()
            .set("100lbmatte", 1)
            .set("100lbsatin", 1.1)
            .set("130lbmatte", 1.2)
            .set("130lbsatin", 1.3),
          dimensions: new Map().set(JSON.stringify([11, 8.5]), 1),
        },
        quantityDiscountMultipliers: [
          [1000, 0.8],
          [500, 0.85],
          [100, 0.9],
          [50, 0.95],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "pad de facturas y recibos",
      images: [],
      options: {
        paper: ["bond", "chemical"],
        dimensions: [
          [5.5, 8.5],
          [8.5, 11],
        ],
      },
      pricing: {
        baseUnitPrice: 25,
        optionMultipliers: {
          paper: new Map().set("bond", 1).set("chemical", 1.2),
          dimensions: new Map()
            .set(JSON.stringify([5.5, 8.5]), 1)
            .set(JSON.stringify([8.5, 11]), 1.6),
        },
        quantityDiscountMultipliers: [
          [100, 0.85],
          [50, 0.9],
          [25, 0.95],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
  ]);
};

seed()
  .then(() => {
    console.log("Successfully seeded products");
    exit(0);
  })
  .catch((err) => {
    console.error(`Error running product seed script: ${JSON.stringify(err)}`);
    exit(1);
  });

module.exports = { seed };
