export const ALEO_PROGRAM_ID = 'compliance.aleo';

// GPS coordinate scale factor (6 decimal places)
export const GPS_SCALE = 1_000_000;

// Predefined approved regions (public bounds)
export const APPROVED_REGIONS = [
  {
    id: 'taiwan',
    name: 'Taiwan Approved Zone',
    bounds: {
      min_lat: 21_900_000n,
      max_lat: 25_300_000n,
      min_lng: 120_000_000n,
      max_lng: 122_000_000n,
    },
  },
  {
    id: 'japan',
    name: 'Japan Approved Zone',
    bounds: {
      min_lat: 24_000_000n,
      max_lat: 45_700_000n,
      min_lng: 122_900_000n,
      max_lng: 153_900_000n,
    },
  },
  {
    id: 'singapore',
    name: 'Singapore Approved Zone',
    bounds: {
      min_lat: 1_100_000n,
      max_lat: 1_500_000n,
      min_lng: 103_500_000n,
      max_lng: 104_100_000n,
    },
  },
] as const;

export type RegionId = (typeof APPROVED_REGIONS)[number]['id'];

// Default operational thresholds (public)
export const DEFAULT_THRESHOLDS = {
  min_uptime: 90n,
  min_hashrate: 400n,
} as const;
