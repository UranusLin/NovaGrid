import { z } from 'zod';

// Payload sent by a hardware node to report its metrics.
// All values are sent over a private authenticated channel (mTLS / API key).
export const DeviceMetricsSchema = z.object({
  // Stable hardware identity — hashed device serial number (hex field element for Aleo)
  device_id: z.string().regex(/^[0-9a-fA-F]+field$/, 'Must be a valid Aleo field element'),

  // Device GPS coordinates scaled to u64 (multiply decimal by 1e6, round to integer)
  // e.g. lat=25.033 → lat_u64=25033000
  lat_u64: z.number().int().min(0),
  lng_u64: z.number().int().min(0),

  // Operational metrics (0–100 for uptime_pct; hashrate in TH/s)
  uptime_pct: z.number().int().min(0).max(100),
  hashrate_ths: z.number().int().min(0),

  // Operator Ethereum address for reward crediting
  operator_address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Must be a valid Ethereum address'),
});

export type DeviceMetrics = z.infer<typeof DeviceMetricsSchema>;

// Result of running the Aleo proof pipeline for a device
export type ProofResult = {
  device_id: string;
  operator_address: string;
  trust_score: number;   // 40–100
  location_ok: boolean;
  ops_ok: boolean;
};

// Region approved for DePIN node operation (mirrors Aleo RegionBounds struct, scaled by 1e6)
export type RegionBounds = {
  min_lat: number;
  max_lat: number;
  min_lng: number;
  max_lng: number;
};
