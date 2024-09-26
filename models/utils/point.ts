import mongoose from "mongoose";

interface Point {
  type: "Point";
  coordinates: [number, number];
}

const Point = new mongoose.Schema<Point>(
  {
    type: {
      type: String,
      set: () => "Point",
      default: "Point",
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
