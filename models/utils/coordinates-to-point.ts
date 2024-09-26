import { Point } from './point';

export const coordinatesToPoint = ({
  longitude,
  latitude,
}: {
  longitude: number;
  latitude: number;
}): Point => ({
  type: 'Point',
  coordinates: [longitude, latitude],
});
