import { GPS_SCALE, APPROVED_REGIONS } from './constants';
import type { RegionId } from './constants';

// Scale decimal GPS coordinate to integer for Leo (multiply by 1_000_000)
export function scaleCoordinate(coord: number): bigint {
  return BigInt(Math.round(coord * GPS_SCALE));
}

// Format Leo DeviceLocation struct string
export function formatDeviceLocation(lat: number, lng: number): string {
  const scaledLat = scaleCoordinate(lat);
  const scaledLng = scaleCoordinate(lng);
  return `{ lat: ${scaledLat}u64, lng: ${scaledLng}u64 }`;
}

// Format Leo RegionBounds struct string from region id
export function formatRegionBounds(regionId: RegionId): string {
  const region = APPROVED_REGIONS.find((r) => r.id === regionId);
  if (!region) throw new Error(`Unknown region: ${regionId}`);
  const { min_lat, max_lat, min_lng, max_lng } = region.bounds;
  return `{ min_lat: ${min_lat}u64, max_lat: ${max_lat}u64, min_lng: ${min_lng}u64, max_lng: ${max_lng}u64 }`;
}

// Normalize raw hashrate to 0–100 score
export function normalizeHashrate(hashrate: number, maxHashrate = 1000): bigint {
  const normalized = Math.min(100, Math.round((hashrate / maxHashrate) * 100));
  return BigInt(normalized);
}
