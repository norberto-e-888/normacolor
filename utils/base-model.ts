import { ObjectId } from "mongoose";

export interface BaseModel {
  _id: ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
