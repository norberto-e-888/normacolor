import { ObjectId } from "mongoose";

export interface BaseModel<FE extends boolean = false> {
  _id: FE extends true ? undefined : ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
