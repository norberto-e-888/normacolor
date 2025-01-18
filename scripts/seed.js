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
        minimumPurchase: 5000,
        baseUnitPrice: 10,
        optionMultipliers: {
          sides: { one: 1, both: 1.8 },
          finish: { plastifiedgloss: 1.5 },
          paper: { "300gmatte": 1 },
          dimensions: {},
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
        finish: [],
        paper: ["300gmatte", "300gsatin"],
        dimensions: [[4, 6]],
      },
      pricing: {
        minimumPurchase: 10000,
        baseUnitPrice: 20,
        optionMultipliers: {
          sides: { one: 1, both: 1.7 },
          finish: {},
          paper: { "300gmatte": 1, "300gsatin": 1.1 },
          dimensions: {},
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
        minimumPurchase: 10000,
        baseUnitPrice: 190,
        optionMultipliers: {
          sides: { one: 1 },
          finish: {
            plastifiedgloss: 1.3,
            plastifiedmatte: 1.3,
            uvvarnishgloss: 1.1,
          },
          paper: { "300gmatte": 1 },
          dimensions: {},
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
        finish: [],
        paper: ["bond20lb"],
        dimensions: [[8.5, 11]],
      },
      pricing: {
        minimumPurchase: 10000,
        baseUnitPrice: 80,
        optionMultipliers: {
          sides: { one: 1 },
          finish: {},
          paper: { bond20lb: 1 },
          dimensions: {},
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
        finish: [],
        paper: ["150gmatte", "130lbmatte", "100lbmatte", "100lbsatin"],
        dimensions: [
          [3.5, 8.5],
          [5.5, 8.5],
          [8.5, 11],
        ],
      },
      pricing: {
        minimumPurchase: 10000,
        baseUnitPrice: 25,
        optionMultipliers: {
          sides: { one: 1, both: 1.8 },
          finish: {},
          paper: {
            "150gmatte": 1.2,
            "130lbmatte": 1.1,
            "100lbmatte": 1,
            "100lbsatin": 1.1,
          },
          dimensions: {
            [JSON.stringify([5.5, 8.5])]: 1.2,
            [JSON.stringify([8.5, 11])]: 1.8,
          },
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
        finish: [],
        paper: ["100lbmatte", "100lbsatin"],
        dimensions: [[12, 18]],
      },
      pricing: {
        minimumPurchase: 10000,
        baseUnitPrice: 90,
        optionMultipliers: {
          sides: { one: 1 },
          finish: {},
          paper: { "100lbmatte": 1, "100lbsatin": 1.1 },
          dimensions: {},
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
        paper: [],
        dimensions: [[12, 18]],
      },
      pricing: {
        minimumPurchase: 25000,
        baseUnitPrice: 45,
        optionMultipliers: {
          sides: { one: 1, both: 1.89 },
          finish: { plastifiedgloss: 1, plastifiedmatte: 1.12 },
          paper: {},
          dimensions: {},
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
        paper: [],
        dimensions: [[12, 18]],
      },
      pricing: {
        minimumPurchase: 25000,
        baseUnitPrice: 15,
        optionMultipliers: {
          sides: { one: 1, both: 2 },
          finish: { uvvarnishgloss: 1, uvvarnishmatte: 1.34 },
          paper: {},
          dimensions: {},
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
        finish: [],
        paper: ["100lbmatte", "100lbsatin", "130lbmatte", "130lbsatin"],
        dimensions: [[11, 8.5]],
      },
      pricing: {
        minimumPurchase: 10000,
        baseUnitPrice: 75,
        optionMultipliers: {
          sides: { diptic: 1, triptic: 1.5 },
          finish: {},
          paper: {
            "100lbmatte": 1,
            "100lbsatin": 1.1,
            "130lbmatte": 1.2,
            "130lbsatin": 1.3,
          },
          dimensions: {},
        },
        quantityDiscountMultipliers: [
          [1000, 0.65],
          [500, 0.8],
          [100, 0.9],
        ],
      },
      isPublic: true,
      createdAt: new Date(),
    },
    {
      name: "pad de facturas y recibos",
      images: [],
      options: {
        sides: ["one"],
        finish: [],
        paper: ["bond", "chemical"],
        dimensions: [
          [5.5, 8.5],
          [8.5, 11],
        ],
      },
      pricing: {
        minimumPurchase: 10000,
        baseUnitPrice: 25,
        optionMultipliers: {
          sides: { one: 1 },
          finish: {},
          paper: { bond: 1, chemical: 1.2 },
          dimensions: { [JSON.stringify([8.5, 11])]: 1.6 },
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
