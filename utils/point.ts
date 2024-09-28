import mongoose from "mongoose";

const POINT = "POINT";

export interface Point {
  type: typeof POINT;
  coordinates: [number, number];
}

export const Point = new mongoose.Schema<Point>(
  {
    type: {
      type: String,
      set: () => POINT,
      default: POINT,
      required: true,
    },
    coordinates: {
      type: [Number, Number],
      transform: (v: [number, number]) =>
        v.map((coordinate) => coordinate.toFixed(6)),
      required: true,
    },
  },
  {
    _id: false,
  }
);

export const coordinatesToPoint = ({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}): Point => ({
  type: POINT,
  coordinates: [longitude, latitude],
});
