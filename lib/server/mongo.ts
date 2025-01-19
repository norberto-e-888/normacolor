// lib/server/mongo.ts
"use server";

import { MongoClient, MongoClientOptions, ServerApiVersion } from "mongodb";
import mongoose from "mongoose";

import { createOrderFrequencyView } from "@/database/user";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let mongoClient: MongoClient;

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri, options);
  }

  mongoClient = globalWithMongo._mongoClient;
} else {
  mongoClient = new MongoClient(uri, options);
}

export const connectToMongo = async () => {
  if (
    mongoose.connection.readyState === 1 ||
    mongoose.connection.readyState === 2
  ) {
    return mongoose.connection;
  }

  const connection = await mongoose.connect(uri);
  await createOrderFrequencyView();
  return connection;
};

export const getMongoClient = async () => mongoClient;
