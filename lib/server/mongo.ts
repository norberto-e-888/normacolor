"use server";

// This approach is taken from https://github.com/vercel/next.js/tree/canary/examples/with-mongodb
import { MongoClient, MongoClientOptions, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";

const isAtlas = process.env.MONGODB_USE_ATLAS === "true";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

if (
  isAtlas &&
  (!process.env.MONGODB_ATLAS_USER || !process.env.MONGODB_ATLAS_PASSWORD)
) {
  throw new Error(
    'Invalid/Missing environment variable: "MONGODB_ATLAS_USER" or "MONGODB_ATLAS_PASSWORD"'
  );
}

let uri = process.env.MONGODB_URI;

if (isAtlas) {
  uri = uri
    .replace(
      "<user>",
      encodeURIComponent(process.env.MONGODB_ATLAS_USER as string)
    )
    .replace(
      "<password>",
      encodeURIComponent(process.env.MONGODB_ATLAS_PASSWORD as string)
    );
}

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let mongoClient: MongoClient;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }

  mongoClient = globalWithMongo._mongoClient;
} else {
  // In production mode, it's best to not use a global variable.
  mongoClient = new MongoClient(uri, options);
}

export const connectToMongo = async () => {
  if (
    mongoose.connection.readyState === 1 ||
    mongoose.connection.readyState === 2
  ) {
    return mongoose.connection;
  }

  return mongoose.connect(uri);
};

export const getMongoClient = async () => mongoClient;
