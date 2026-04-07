# Plan A: Monorepo Scaffold + Aleo Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the monorepo skeleton and the complete Aleo ZK compliance module (Leo program + frontend) ready for Wave 4 submission.

**Architecture:** Monorepo root with npm workspaces. Leo program `compliance.aleo` has 3 transitions (verify_compliance, verify_device_credentials, compute_node_score). Frontend runs proof generation in a Web Worker using @demox-labs/aleo-sdk (WASM). Shield Wallet is the required wallet adapter.

**Tech Stack:** Leo CLI, @demox-labs/aleo-sdk, Next.js 14 (App Router), React 18, TypeScript strict, TailwindCSS 3.4, Shield Wallet adapter

**Deadline:** Aleo Wave 4 — ~6 days from 2026-04-07

---

## File Map

### Monorepo Root
- Create: `package.json` — workspace config
- Create: `tsconfig.base.json` — shared TS compiler options

### contracts/aleo-compliance/
- Create: `program.json` — Leo project metadata
- Create: `src/main.leo` — 3 transitions
- Create: `inputs/verify_compliance.in` — test: device inside Taiwan region
- Create: `inputs/verify_compliance_fail.in` — test: device outside region
- Create: `inputs/verify_device_credentials.in` — test: device meets thresholds
- Create: `inputs/verify_device_credentials_fail.in` — test: device below threshold
- Create: `inputs/compute_node_score.in` — test: compute score = 92

### apps/web-dashboard/
- Create: `package.json`
- Create: `next.config.js` — WASM support for Aleo SDK
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `src/app/layout.tsx` — root layout with providers
- Create: `src/app/page.tsx` — dashboard with PrivacyLayersPanel
- Create: `src/app/compliance/page.tsx` — compliance proof page
- Create: `src/components/providers/Web3Provider.tsx` — Shield Wallet + QueryClient
- Create: `src/components/dashboard/PrivacyLayersPanel.tsx` — status panel
- Create: `src/components/aleo/ComplianceProver.tsx` — proof generation UI
- Create: `src/components/aleo/ProofStatus.tsx` — loading/result display
- Create: `src/hooks/useAleoWorker.ts` — Web Worker interface hook
- Create: `src/workers/aleo.worker.ts` — WASM proof generation worker
- Create: `src/lib/constants.ts` — region definitions, thresholds
- Create: `src/lib/aleo.ts` — coordinate scaling utilities

---

## Task 1: Monorepo Root Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "novagrid-monorepo",
  "private": true,
  "workspaces": [
    "apps/web-dashboard",
    "apps/hardware-relayer",
    "contracts/fhenix-settlement"
  ],
  "scripts": {
    "dev:web": "npm -w apps/web-dashboard run dev",
    "dev:relayer": "npm -w apps/hardware-relayer run dev",
    "build:web": "npm -w apps/web-dashboard run build",
    "test:contracts": "npm -w contracts/fhenix-settlement run test",
    "test:relayer": "npm -w apps/hardware-relayer run test"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Create monorepo directory structure**

```bash
mkdir -p apps/web-dashboard apps/hardware-relayer
mkdir -p contracts/fhenix-settlement contracts/aleo-compliance
```

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.base.json
git commit -m "v0.2.0: monorepo root scaffold"
```

---

## Task 2: Leo Project Setup

**Files:**
- Create: `contracts/aleo-compliance/program.json`
- Create: `contracts/aleo-compliance/src/main.leo` (skeleton)

**Prerequisite:** Leo CLI must be installed.
```bash
# Check if installed:
leo --version
# If not installed:
cargo install leo-lang
# Or download binary from: https://github.com/AleoHQ/leo/releases
```

- [ ] **Step 1: Create program.json**

```bash
mkdir -p contracts/aleo-compliance/src contracts/aleo-compliance/inputs
```

File: `contracts/aleo-compliance/program.json`
```json
{
  "program": "compliance.aleo",
  "version": "0.1.0",
  "description": "ZK compliance verification for DePIN device locations and credentials",
  "license": "MIT"
}
```

- [ ] **Step 2: Create main.leo skeleton (structs only)**

File: `contracts/aleo-compliance/src/main.leo`
```leo
program compliance.aleo {

    struct DeviceLocation {
        lat: u64,
        lng: u64,
    }

    struct RegionBounds {
        min_lat: u64,
        max_lat: u64,
        min_lng: u64,
        max_lng: u64,
    }

    transition verify_compliance(
        private device: DeviceLocation,
        public region: RegionBounds,
        private device_id: field,
    ) -> bool {
        return true;
    }

}
```

- [ ] **Step 3: Verify Leo can parse the file**

```bash
cd contracts/aleo-compliance
leo build
```

Expected: Build succeeds, `build/` directory created.

- [ ] **Step 4: Commit**

```bash
git add contracts/aleo-compliance/
git commit -m "feat(aleo): initialize Leo project with compliance.aleo skeleton"
```

---

## Task 3: verify_compliance Transition

**Files:**
- Modify: `contracts/aleo-compliance/src/main.leo`
- Create: `contracts/aleo-compliance/inputs/verify_compliance.in`
- Create: `contracts/aleo-compliance/inputs/verify_compliance_fail.in`

- [ ] **Step 1: Write failing test input (device INSIDE Taiwan)**

File: `contracts/aleo-compliance/inputs/verify_compliance.in`
```
// Device at Taipei (25.033°N, 121.565°E), inside Taiwan bounding box
[verify_compliance]
device: DeviceLocation = DeviceLocation {
    lat: 25033000u64,
    lng: 121565000u64
};
region: RegionBounds = RegionBounds {
    min_lat: 21900000u64,
    max_lat: 25300000u64,
    min_lng: 120000000u64,
    max_lng: 122000000u64
};
device_id: field = 12345field;
```

- [ ] **Step 2: Run test — expect current skeleton returns true (accidental pass)**

```bash
cd contracts/aleo-compliance
leo run verify_compliance --input inputs/verify_compliance.in
```

Expected: `• Output • true`

- [ ] **Step 3: Write the real implementation**

Replace the `verify_compliance` transition body in `src/main.leo`:
```leo
    transition verify_compliance(
        private device: DeviceLocation,
        public region: RegionBounds,
        private device_id: field,
    ) -> bool {
        let lat_ok: bool = device.lat >= region.min_lat && device.lat <= region.max_lat;
        let lng_ok: bool = device.lng >= region.min_lng && device.lng <= region.max_lng;
        return lat_ok && lng_ok;
    }
```

- [ ] **Step 4: Run passing test**

```bash
leo run verify_compliance --input inputs/verify_compliance.in
```

Expected: `• Output • true`

- [ ] **Step 5: Create failing test input (device OUTSIDE Taiwan)**

File: `contracts/aleo-compliance/inputs/verify_compliance_fail.in`
```
// Device at Tokyo (35.689°N, 139.692°E), outside Taiwan bounding box
[verify_compliance]
device: DeviceLocation = DeviceLocation {
    lat: 35689000u64,
    lng: 139692000u64
};
region: RegionBounds = RegionBounds {
    min_lat: 21900000u64,
    max_lat: 25300000u64,
    min_lng: 120000000u64,
    max_lng: 122000000u64
};
device_id: field = 12345field;
```

- [ ] **Step 6: Run failing test — should return false**

```bash
leo run verify_compliance --input inputs/verify_compliance_fail.in
```

Expected: `• Output • false`

- [ ] **Step 7: Commit**

```bash
git add contracts/aleo-compliance/
git commit -m "feat(aleo): implement verify_compliance transition with GPS bounds check"
```

---

## Task 4: verify_device_credentials Transition

**Files:**
- Modify: `contracts/aleo-compliance/src/main.leo`
- Create: `contracts/aleo-compliance/inputs/verify_device_credentials.in`
- Create: `contracts/aleo-compliance/inputs/verify_device_credentials_fail.in`

- [ ] **Step 1: Add transition to main.leo**

Add inside the `program compliance.aleo { }` block, after `verify_compliance`:
```leo
    transition verify_device_credentials(
        private uptime_pct: u64,
        private hashrate: u64,
        public min_uptime: u64,
        public min_hashrate: u64,
        private device_id: field,
    ) -> bool {
        let uptime_ok: bool = uptime_pct >= min_uptime;
        let hashrate_ok: bool = hashrate >= min_hashrate;
        return uptime_ok && hashrate_ok;
    }
```

- [ ] **Step 2: Create passing test input**

File: `contracts/aleo-compliance/inputs/verify_device_credentials.in`
```
// Device with 95% uptime and 500 TH/s hashrate — meets 90%/400 thresholds
[verify_device_credentials]
uptime_pct: u64 = 95u64;
hashrate: u64 = 500u64;
min_uptime: u64 = 90u64;
min_hashrate: u64 = 400u64;
device_id: field = 12345field;
```

- [ ] **Step 3: Run passing test**

```bash
cd contracts/aleo-compliance
leo run verify_device_credentials --input inputs/verify_device_credentials.in
```

Expected: `• Output • true`

- [ ] **Step 4: Create failing test input**

File: `contracts/aleo-compliance/inputs/verify_device_credentials_fail.in`
```
// Device with 70% uptime — below 90% threshold
[verify_device_credentials]
uptime_pct: u64 = 70u64;
hashrate: u64 = 500u64;
min_uptime: u64 = 90u64;
min_hashrate: u64 = 400u64;
device_id: field = 12345field;
```

- [ ] **Step 5: Run failing test**

```bash
leo run verify_device_credentials --input inputs/verify_device_credentials_fail.in
```

Expected: `• Output • false`

- [ ] **Step 6: Commit**

```bash
git add contracts/aleo-compliance/
git commit -m "feat(aleo): add verify_device_credentials transition"
```

---

## Task 5: compute_node_score Transition

**Files:**
- Modify: `contracts/aleo-compliance/src/main.leo`
- Create: `contracts/aleo-compliance/inputs/compute_node_score.in`

- [ ] **Step 1: Add transition to main.leo**

Add inside the program block, after `verify_device_credentials`:
```leo
    // Combines location and operational compliance into a single trust score.
    // Score formula: 40 (base, requires both checks pass) + 30% * uptime + 30% * hashrate_score
    // Output range: 40–100 (40 = minimum compliance, 100 = perfect node)
    transition compute_node_score(
        private location_ok: bool,
        private ops_ok: bool,
        private uptime_pct: u64,
        private hashrate_score: u64,
        private device_id: field,
    ) -> u64 {
        assert(location_ok);
        assert(ops_ok);
        let uptime_weight: u64 = uptime_pct * 30u64 / 100u64;
        let hashrate_weight: u64 = hashrate_score * 30u64 / 100u64;
        let score: u64 = 40u64 + uptime_weight + hashrate_weight;
        return score;
    }
```

- [ ] **Step 2: Create test input — expected score 92**

File: `contracts/aleo-compliance/inputs/compute_node_score.in`
```
// uptime=95 → 95*30/100=28, hashrate_score=80 → 80*30/100=24
// Expected: 40 + 28 + 24 = 92
[compute_node_score]
location_ok: bool = true;
ops_ok: bool = true;
uptime_pct: u64 = 95u64;
hashrate_score: u64 = 80u64;
device_id: field = 12345field;
```

- [ ] **Step 3: Run and verify output is 92**

```bash
cd contracts/aleo-compliance
leo run compute_node_score --input inputs/compute_node_score.in
```

Expected: `• Output • 92u64`

- [ ] **Step 4: Build final Leo program**

```bash
leo build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add contracts/aleo-compliance/
git commit -m "feat(aleo): add compute_node_score transition — cross-module trust score bridge"
```

---

## Task 6: Next.js Web Dashboard Scaffold

**Files:**
- Create: `apps/web-dashboard/package.json`
- Create: `apps/web-dashboard/next.config.js`
- Create: `apps/web-dashboard/tailwind.config.ts`
- Create: `apps/web-dashboard/tsconfig.json`
- Create: `apps/web-dashboard/postcss.config.js`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd apps/web-dashboard
npx create-next-app@14 . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

When prompted, confirm all defaults.

- [ ] **Step 2: Install Aleo + wallet dependencies**

```bash
cd apps/web-dashboard
npm install @demox-labs/aleo-sdk@latest
npm install wagmi@^2.12.0 viem@^2.21.0 @tanstack/react-query@^5.50.0
npm install @headlessui/react@^2.1.0 lucide-react@^0.400.0
```

**Shield Wallet adapter:** Check https://shield-wallet-docs (from competition resources) for the exact npm package name. Install it:
```bash
# Verify the package name from Shield Wallet Adapter Docs, then:
npm install <shield-wallet-adapter-package>
```

- [ ] **Step 3: Update next.config.js for WASM + Web Worker support**

File: `apps/web-dashboard/next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Enable WASM for Aleo SDK
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Exclude aleo-sdk from server-side bundle
    if (isServer) {
      config.externals = [...(config.externals || []), '@demox-labs/aleo-sdk'];
    }

    return config;
  },
};

module.exports = nextConfig;
```

- [ ] **Step 4: Update tsconfig.json to extend base**

File: `apps/web-dashboard/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 5: Verify dev server starts**

```bash
cd apps/web-dashboard
npm run dev
```

Expected: Server starts on http://localhost:3000 with no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web-dashboard/
git commit -m "feat(web): scaffold Next.js 14 dashboard with Aleo + wallet dependencies"
```

---

## Task 7: Aleo Utility Library and Constants

**Files:**
- Create: `apps/web-dashboard/src/lib/constants.ts`
- Create: `apps/web-dashboard/src/lib/aleo.ts`

- [ ] **Step 1: Create constants.ts with region definitions and thresholds**

File: `apps/web-dashboard/src/lib/constants.ts`
```typescript
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
  min_uptime: 90n,       // 90% uptime required
  min_hashrate: 400n,    // 400 TH/s minimum
} as const;
```

- [ ] **Step 2: Create aleo.ts with coordinate utilities**

File: `apps/web-dashboard/src/lib/aleo.ts`
```typescript
import { GPS_SCALE, APPROVED_REGIONS, RegionId } from './constants';

// Scale decimal GPS to integer for Leo (multiply by 1_000_000)
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

// Normalize hashrate to 0–100 score
// Input: raw hashrate value, max: expected max (e.g. 1000 TH/s = 100 score)
export function normalizeHashrate(hashrate: number, maxHashrate = 1000): bigint {
  const normalized = Math.min(100, Math.round((hashrate / maxHashrate) * 100));
  return BigInt(normalized);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-dashboard/src/lib/
git commit -m "feat(web): add Aleo constants and coordinate utility library"
```

---

## Task 8: Aleo Web Worker

**Files:**
- Create: `apps/web-dashboard/src/workers/aleo.worker.ts`

- [ ] **Step 1: Create the Web Worker**

File: `apps/web-dashboard/src/workers/aleo.worker.ts`
```typescript
// Runs in a Web Worker thread to avoid blocking the UI during WASM proof generation.
// Proof generation takes 10–30 seconds.

import type { RegionId } from '../lib/constants';
import { DEFAULT_THRESHOLDS } from '../lib/constants';
import { formatDeviceLocation, formatRegionBounds, normalizeHashrate } from '../lib/aleo';

type WorkerMessage =
  | {
      type: 'VERIFY_COMPLIANCE';
      payload: { lat: number; lng: number; regionId: RegionId; deviceId: string };
    }
  | {
      type: 'VERIFY_CREDENTIALS';
      payload: { uptimePct: number; hashrate: number; deviceId: string };
    }
  | {
      type: 'COMPUTE_SCORE';
      payload: {
        locationOk: boolean;
        opsOk: boolean;
        uptimePct: number;
        hashrateScore: number;
        deviceId: string;
      };
    };

async function initAleo() {
  const { default: init } = await import('@demox-labs/aleo-sdk');
  await init();
  const { ProgramManager } = await import('@demox-labs/aleo-sdk');
  return ProgramManager;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    const ProgramManager = await initAleo();
    const pm = new ProgramManager();

    if (type === 'VERIFY_COMPLIANCE') {
      self.postMessage({ type: 'STATUS', message: 'Generating location proof...' });

      const inputs = [
        formatDeviceLocation(payload.lat, payload.lng),
        formatRegionBounds(payload.regionId),
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline(
        'compliance.aleo',
        'verify_compliance',
        inputs,
        false,
      );

      const compliant = result.getOutputs()[0] === 'true';
      self.postMessage({ type: 'COMPLIANCE_RESULT', compliant, raw: result });
    }

    if (type === 'VERIFY_CREDENTIALS') {
      self.postMessage({ type: 'STATUS', message: 'Generating credentials proof...' });

      const inputs = [
        `${BigInt(Math.round(payload.uptimePct))}u64`,
        `${BigInt(Math.round(payload.hashrate))}u64`,
        `${DEFAULT_THRESHOLDS.min_uptime}u64`,
        `${DEFAULT_THRESHOLDS.min_hashrate}u64`,
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline(
        'compliance.aleo',
        'verify_device_credentials',
        inputs,
        false,
      );

      const credentialsOk = result.getOutputs()[0] === 'true';
      self.postMessage({ type: 'CREDENTIALS_RESULT', credentialsOk, raw: result });
    }

    if (type === 'COMPUTE_SCORE') {
      self.postMessage({ type: 'STATUS', message: 'Computing trust score...' });

      const inputs = [
        payload.locationOk ? 'true' : 'false',
        payload.opsOk ? 'true' : 'false',
        `${BigInt(Math.round(payload.uptimePct))}u64`,
        `${BigInt(Math.round(payload.hashrateScore))}u64`,
        `${payload.deviceId}field`,
      ];

      const result = await pm.executeOffline(
        'compliance.aleo',
        'compute_node_score',
        inputs,
        false,
      );

      const scoreStr = result.getOutputs()[0];
      const score = parseInt(scoreStr.replace('u64', ''), 10);
      self.postMessage({ type: 'SCORE_RESULT', score, raw: result });
    }
  } catch (err) {
    self.postMessage({ type: 'ERROR', message: (err as Error).message });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-dashboard/src/workers/
git commit -m "feat(web): add Aleo Web Worker for proof generation"
```

---

## Task 9: useAleoWorker Hook

**Files:**
- Create: `apps/web-dashboard/src/hooks/useAleoWorker.ts`

- [ ] **Step 1: Create the hook**

File: `apps/web-dashboard/src/hooks/useAleoWorker.ts`
```typescript
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RegionId } from '@/lib/constants';

export type ProofStep = 'idle' | 'location' | 'credentials' | 'score' | 'done' | 'error';

export type ProofState = {
  step: ProofStep;
  statusMessage: string;
  locationOk: boolean | null;
  credentialsOk: boolean | null;
  trustScore: number | null;
  error: string | null;
};

const INITIAL_STATE: ProofState = {
  step: 'idle',
  statusMessage: '',
  locationOk: null,
  credentialsOk: null,
  trustScore: null,
  error: null,
};

export function useAleoWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [state, setState] = useState<ProofState>(INITIAL_STATE);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/aleo.worker.ts', import.meta.url),
      { type: 'module' },
    );

    workerRef.current.onmessage = (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'STATUS':
          setState((prev) => ({ ...prev, statusMessage: msg.message }));
          break;
        case 'COMPLIANCE_RESULT':
          setState((prev) => ({
            ...prev,
            locationOk: msg.compliant,
            step: 'credentials',
            statusMessage: msg.compliant
              ? '✓ Location verified. Checking credentials...'
              : '✗ Location outside approved region.',
          }));
          break;
        case 'CREDENTIALS_RESULT':
          setState((prev) => ({
            ...prev,
            credentialsOk: msg.credentialsOk,
            step: msg.credentialsOk ? 'score' : 'done',
            statusMessage: msg.credentialsOk
              ? '✓ Credentials verified. Computing trust score...'
              : '✗ Device does not meet operational thresholds.',
          }));
          break;
        case 'SCORE_RESULT':
          setState((prev) => ({
            ...prev,
            trustScore: msg.score,
            step: 'done',
            statusMessage: `✓ Trust score: ${msg.score}/100`,
          }));
          break;
        case 'ERROR':
          setState((prev) => ({
            ...prev,
            step: 'error',
            error: msg.message,
            statusMessage: 'Proof generation failed.',
          }));
          break;
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const generateFullProof = useCallback(
    (params: {
      lat: number;
      lng: number;
      regionId: RegionId;
      uptimePct: number;
      hashrate: number;
      deviceId: string;
    }) => {
      setState({ ...INITIAL_STATE, step: 'location', statusMessage: 'Starting proof generation...' });
      workerRef.current?.postMessage({
        type: 'VERIFY_COMPLIANCE',
        payload: { lat: params.lat, lng: params.lng, regionId: params.regionId, deviceId: params.deviceId },
      });

      // Credentials and score are triggered by the worker message handler above.
      // Store params for subsequent calls:
      const handler = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.type === 'COMPLIANCE_RESULT' && msg.compliant) {
          workerRef.current?.postMessage({
            type: 'VERIFY_CREDENTIALS',
            payload: {
              uptimePct: params.uptimePct,
              hashrate: params.hashrate,
              deviceId: params.deviceId,
            },
          });
        }
        if (msg.type === 'CREDENTIALS_RESULT' && msg.credentialsOk) {
          const hashrateScore = Math.min(100, Math.round((params.hashrate / 1000) * 100));
          workerRef.current?.postMessage({
            type: 'COMPUTE_SCORE',
            payload: {
              locationOk: true,
              opsOk: true,
              uptimePct: params.uptimePct,
              hashrateScore,
              deviceId: params.deviceId,
            },
          });
        }
        if (['COMPLIANCE_RESULT', 'CREDENTIALS_RESULT', 'SCORE_RESULT', 'ERROR'].includes(msg.type)) {
          workerRef.current?.removeEventListener('message', handler);
        }
      };

      workerRef.current?.addEventListener('message', handler);
    },
    [],
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { ...state, generateFullProof, reset };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-dashboard/src/hooks/useAleoWorker.ts
git commit -m "feat(web): add useAleoWorker hook for sequential proof orchestration"
```

---

## Task 10: Web3Provider with Shield Wallet

**Files:**
- Create: `apps/web-dashboard/src/components/providers/Web3Provider.tsx`

- [ ] **Step 1: Create Web3Provider**

**Note:** Before this step, check Shield Wallet Adapter Docs for the exact import path and adapter class name. The pattern below uses a placeholder `ShieldWalletAdapter` — replace with the actual import from the Shield Wallet package.

File: `apps/web-dashboard/src/components/providers/Web3Provider.tsx`
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

// Shield Wallet — verify exact import from Shield Wallet Adapter Docs
// import { ShieldWalletAdapter } from '<shield-wallet-package>';

const fhenixHelium = {
  id: 8008135,
  name: 'Fhenix Helium',
  nativeCurrency: { name: 'tFHE', symbol: 'tFHE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://api.helium.fhenix.zone'] },
  },
  blockExplorers: {
    default: { name: 'Fhenix Explorer', url: 'https://explorer.helium.fhenix.zone' },
  },
} as const;

const wagmiConfig = createConfig({
  chains: [fhenixHelium],
  connectors: [injected()],
  transports: { [fhenixHelium.id]: http() },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

**TODO (after checking Shield Wallet docs):** Wrap children with the Shield Wallet provider. The pattern will look similar to:
```typescript
// <ShieldWalletProvider adapters={[new ShieldWalletAdapter()]}>
//   {children}
// </ShieldWalletProvider>
```

- [ ] **Step 2: Update root layout to use Web3Provider**

File: `apps/web-dashboard/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/components/providers/Web3Provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NovaGrid — Privacy-First DePIN',
  description: 'ZK + FHE powered DePIN infrastructure',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-dashboard/src/components/providers/ apps/web-dashboard/src/app/layout.tsx
git commit -m "feat(web): add Web3Provider with wagmi + Shield Wallet integration"
```

---

## Task 11: PrivacyLayersPanel Component

**Files:**
- Create: `apps/web-dashboard/src/components/dashboard/PrivacyLayersPanel.tsx`

- [ ] **Step 1: Create the panel component**

File: `apps/web-dashboard/src/components/dashboard/PrivacyLayersPanel.tsx`
```typescript
'use client';

type LayerStatus = 'active' | 'idle' | 'synced' | 'disconnected';

type Layer = {
  icon: string;
  name: string;
  tech: string;
  status: LayerStatus;
  detail: string;
};

type Props = {
  zkScore: number | null;
  fheConnected: boolean;
  daLastSync: string | null;
};

const STATUS_COLORS: Record<LayerStatus, string> = {
  active: 'text-emerald-400',
  synced: 'text-blue-400',
  idle: 'text-gray-500',
  disconnected: 'text-red-400',
};

const STATUS_DOT: Record<LayerStatus, string> = {
  active: 'bg-emerald-400',
  synced: 'bg-blue-400',
  idle: 'bg-gray-500',
  disconnected: 'bg-red-400',
};

export function PrivacyLayersPanel({ zkScore, fheConnected, daLastSync }: Props) {
  const layers: Layer[] = [
    {
      icon: '🛡',
      name: 'ZK Layer',
      tech: 'Aleo',
      status: zkScore !== null ? 'active' : 'idle',
      detail: zkScore !== null ? `Node Score: ${zkScore}/100` : 'No proof generated',
    },
    {
      icon: '🔐',
      name: 'FHE Layer',
      tech: 'Fhenix',
      status: fheConnected ? 'active' : 'idle',
      detail: fheConnected ? 'Balance: Encrypted 🔒' : 'Wallet not connected',
    },
    {
      icon: '📡',
      name: 'DA Layer',
      tech: '0G',
      status: daLastSync ? 'synced' : 'idle',
      detail: daLastSync ? `Last relay: ${daLastSync}` : 'No data submitted',
    },
  ];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
        NovaGrid Privacy Stack
      </h2>
      <div className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{layer.icon}</span>
              <div>
                <span className="text-sm font-medium text-gray-200">
                  {layer.name}
                </span>
                <span className="ml-2 text-xs text-gray-500">({layer.tech})</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{layer.detail}</span>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${STATUS_DOT[layer.status]}`} />
                <span className={`text-xs font-medium ${STATUS_COLORS[layer.status]}`}>
                  {layer.status.charAt(0).toUpperCase() + layer.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-dashboard/src/components/dashboard/
git commit -m "feat(web): add PrivacyLayersPanel dashboard component"
```

---

## Task 12: ProofStatus + ComplianceProver Components

**Files:**
- Create: `apps/web-dashboard/src/components/aleo/ProofStatus.tsx`
- Create: `apps/web-dashboard/src/components/aleo/ComplianceProver.tsx`

- [ ] **Step 1: Create ProofStatus component**

File: `apps/web-dashboard/src/components/aleo/ProofStatus.tsx`
```typescript
'use client';

import type { ProofState } from '@/hooks/useAleoWorker';

type Props = { state: ProofState };

const STEP_LABELS: Record<ProofState['step'], string> = {
  idle: '',
  location: 'Verifying location...',
  credentials: 'Verifying credentials...',
  score: 'Computing trust score...',
  done: 'Complete',
  error: 'Failed',
};

export function ProofStatus({ state }: Props) {
  if (state.step === 'idle') return null;

  return (
    <div className="mt-4 rounded-lg border border-gray-700 bg-gray-800 p-4">
      <div className="mb-3 flex items-center gap-2">
        {(state.step !== 'done' && state.step !== 'error') && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-t-emerald-400" />
        )}
        <span className="text-sm font-medium text-gray-300">
          {STEP_LABELS[state.step]}
        </span>
      </div>

      {state.statusMessage && (
        <p className="text-xs text-gray-400">{state.statusMessage}</p>
      )}

      {state.step === 'done' && (
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Location Compliance</span>
            <span className={state.locationOk ? 'text-emerald-400' : 'text-red-400'}>
              {state.locationOk ? '✓ Compliant' : '✗ Non-compliant'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Operational Credentials</span>
            <span className={state.credentialsOk ? 'text-emerald-400' : 'text-red-400'}>
              {state.credentialsOk ? '✓ Meets thresholds' : '✗ Below thresholds'}
            </span>
          </div>
          {state.trustScore !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Trust Score</span>
              <span className="font-bold text-emerald-400">{state.trustScore}/100</span>
            </div>
          )}
        </div>
      )}

      {state.step === 'error' && (
        <p className="mt-2 text-xs text-red-400">{state.error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create ComplianceProver component**

File: `apps/web-dashboard/src/components/aleo/ComplianceProver.tsx`
```typescript
'use client';

import { useState } from 'react';
import { APPROVED_REGIONS, DEFAULT_THRESHOLDS } from '@/lib/constants';
import type { RegionId } from '@/lib/constants';
import { useAleoWorker } from '@/hooks/useAleoWorker';
import { ProofStatus } from './ProofStatus';

export function ComplianceProver() {
  const { generateFullProof, reset, ...proofState } = useAleoWorker();

  const [form, setForm] = useState({
    lat: '',
    lng: '',
    regionId: 'taiwan' as RegionId,
    uptimePct: '',
    hashrate: '',
    deviceId: '12345',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    generateFullProof({
      lat: parseFloat(form.lat),
      lng: parseFloat(form.lng),
      regionId: form.regionId,
      uptimePct: parseInt(form.uptimePct, 10),
      hashrate: parseInt(form.hashrate, 10),
      deviceId: form.deviceId,
    });
  }

  const isGenerating = ['location', 'credentials', 'score'].includes(proofState.step);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-1 text-lg font-semibold text-gray-100">ZK Compliance Prover</h2>
      <p className="mb-5 text-sm text-gray-500">
        Private inputs never leave your browser. Only the proof result is shared.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Region selector — public */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Approved Region (public)
          </label>
          <select
            name="regionId"
            value={form.regionId}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:border-emerald-500 focus:outline-none"
          >
            {APPROVED_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* GPS coordinates — private */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Device GPS Coordinates <span className="text-emerald-500">(private)</span>
          </label>
          <div className="flex gap-2">
            <input
              name="lat"
              value={form.lat}
              onChange={handleChange}
              type="number"
              step="any"
              placeholder="Latitude (e.g. 25.033)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <input
              name="lng"
              value={form.lng}
              onChange={handleChange}
              type="number"
              step="any"
              placeholder="Longitude (e.g. 121.565)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Operational metrics — private */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500">
            Operational Metrics <span className="text-emerald-500">(private)</span>
          </label>
          <p className="mb-2 text-xs text-gray-600">
            Thresholds: uptime ≥ {DEFAULT_THRESHOLDS.min_uptime.toString()}% · hashrate ≥ {DEFAULT_THRESHOLDS.min_hashrate.toString()} TH/s
          </p>
          <div className="flex gap-2">
            <input
              name="uptimePct"
              value={form.uptimePct}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              placeholder="Uptime % (e.g. 95)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <input
              name="hashrate"
              value={form.hashrate}
              onChange={handleChange}
              type="number"
              min="0"
              placeholder="Hashrate TH/s (e.g. 500)"
              required
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? 'Generating ZK Proof...' : 'Generate ZK Proof'}
        </button>
      </form>

      <ProofStatus state={proofState} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-dashboard/src/components/aleo/
git commit -m "feat(web): add ComplianceProver and ProofStatus components"
```

---

## Task 13: Pages Assembly

**Files:**
- Create: `apps/web-dashboard/src/app/page.tsx`
- Create: `apps/web-dashboard/src/app/compliance/page.tsx`

- [ ] **Step 1: Create dashboard home page**

File: `apps/web-dashboard/src/app/page.tsx`
```typescript
'use client';

import { useState } from 'react';
import { PrivacyLayersPanel } from '@/components/dashboard/PrivacyLayersPanel';

export default function DashboardPage() {
  // These will be populated by wallet/proof state in later tasks
  const [zkScore] = useState<number | null>(null);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">NovaGrid</h1>
        <p className="mt-1 text-sm text-gray-500">
          Privacy-First DePIN Infrastructure — ZK + FHE
        </p>
      </div>

      <div className="grid gap-4">
        <PrivacyLayersPanel
          zkScore={zkScore}
          fheConnected={false}
          daLastSync={null}
        />

        <div className="grid grid-cols-3 gap-4">
          <a
            href="/compliance"
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-emerald-700"
          >
            <div className="mb-2 text-2xl">🛡</div>
            <div className="font-medium text-gray-200">ZK Compliance</div>
            <div className="mt-1 text-xs text-gray-500">Generate location + credential proofs</div>
          </a>
          <a
            href="/rewards"
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-blue-700"
          >
            <div className="mb-2 text-2xl">🔐</div>
            <div className="font-medium text-gray-200">FHE Rewards</div>
            <div className="mt-1 text-xs text-gray-500">View and claim encrypted balances</div>
          </a>
          <a
            href="/devices"
            className="rounded-xl border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-600"
          >
            <div className="mb-2 text-2xl">📡</div>
            <div className="font-medium text-gray-200">Devices</div>
            <div className="mt-1 text-xs text-gray-500">Manage registered hardware nodes</div>
          </a>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create /compliance page**

File: `apps/web-dashboard/src/app/compliance/page.tsx`
```typescript
import { ComplianceProver } from '@/components/aleo/ComplianceProver';

export const metadata = {
  title: 'ZK Compliance — NovaGrid',
};

export default function CompliancePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <a href="/" className="text-xs text-gray-500 hover:text-gray-300">← Dashboard</a>
        <h1 className="mt-2 text-2xl font-bold text-gray-100">ZK Compliance Prover</h1>
        <p className="mt-1 text-sm text-gray-500">
          Prove your device is compliant without revealing its location or performance metrics.
          Uses Aleo zero-knowledge proofs — everything runs in your browser.
        </p>
      </div>

      <ComplianceProver />

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          How it works
        </h3>
        <ol className="space-y-1 text-xs text-gray-500">
          <li>1. Your GPS coordinates and metrics are <span className="text-emerald-400">private inputs</span> — never transmitted</li>
          <li>2. The approved region bounds are <span className="text-gray-300">public inputs</span> — visible to verifiers</li>
          <li>3. Aleo ZK proofs run in a Web Worker, generating a verifiable proof</li>
          <li>4. The public trust score (0–100) can be used for reward weighting on Fhenix</li>
        </ol>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify pages render without errors**

```bash
cd apps/web-dashboard
npm run dev
```

Visit http://localhost:3000 and http://localhost:3000/compliance — both should render without console errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web-dashboard/src/app/
git commit -m "feat(web): add dashboard home and compliance pages"
```

---

## Task 14: README and Aleo Testnet Deployment

**Files:**
- Create: `README.md`
- Action: Deploy compliance.aleo to Aleo Testnet

- [ ] **Step 1: Create root README.md**

File: `README.md`
```markdown
# NovaGrid — Privacy-First DePIN Infrastructure

A privacy-by-default DePIN infrastructure using ZK (Aleo) + FHE (Fhenix) to protect hardware operators.

## Architecture

```
[Aleo ZK Layer]                    [Fhenix FHE Layer]
  3 Leo transitions                  NovaVault.sol (encrypted balances)
  - verify_compliance                RewardDistributor.sol (trust-weighted)
  - verify_device_credentials              ↑
  - compute_node_score ─── trust_score ───┘
         ↑
  [Web Dashboard (Next.js 14)]
  /compliance — ZK proof generation (Shield Wallet)
  /rewards    — Encrypted balance + claim (@cofhe/react)
  /devices    — Device management (0G DA relay)
         ↑
  [Hardware Relayer (Node.js)]
  IoTeX ioID verification + 0G DA storage
```

## Modules

### 🛡 ZK Compliance (Aleo) — `contracts/aleo-compliance/`
Leo program with 3 transitions proving location compliance, operational credentials, and computing a privacy-preserving trust score.

### 🔐 FHE Settlement (Fhenix) — `contracts/fhenix-settlement/`
Solidity contracts using FHE to encrypt reward balances. Trust scores from Aleo weight reward distribution.

### 🖥 Web Dashboard — `apps/web-dashboard/`
Next.js 14 frontend with Shield Wallet (Aleo) and CoFHE SDK (Fhenix).

### 📡 Hardware Relayer — `apps/hardware-relayer/`
Node.js backend for IoTeX ioID device verification and 0G DA telemetry storage.

## Getting Started

```bash
# Install root dependencies
npm install

# Run web dashboard
npm run dev:web

# Build Leo program (requires leo CLI)
cd contracts/aleo-compliance && leo build

# Run Leo tests
leo run verify_compliance --input inputs/verify_compliance.in
leo run verify_device_credentials --input inputs/verify_device_credentials.in
leo run compute_node_score --input inputs/compute_node_score.in
```

## Privacy Model

- **GPS coordinates** are always `private` Leo inputs — never leave the browser
- **Device performance metrics** are `private` — only the boolean result is revealed
- **Trust scores** are `public` Leo outputs — used for reward weighting
- **Reward balances** are FHE-encrypted on Fhenix — only operator can decrypt via Permit
```

- [ ] **Step 2: Deploy compliance.aleo to Aleo Testnet**

```bash
cd contracts/aleo-compliance

# Ensure you have an Aleo account with testnet credits
# Get testnet ALEO from: https://faucet.aleo.org

# Deploy the program
leo deploy --network testnet --private-key $ALEO_PRIVATE_KEY

# Note the deployed program ID — update ALEO_PROGRAM_ID in constants.ts if different
```

Expected output: Transaction ID and confirmation that `compliance.aleo` is deployed.

- [ ] **Step 3: Final commit and version tag**

```bash
git add README.md
git commit -m "docs: add project README with architecture overview"
git tag v0.3.0 -m "v0.3.0: Aleo module complete — Leo program + frontend"
```

---

## Aleo Wave 4 Submission Checklist

Before submitting on Akindo:

- [ ] `compliance.aleo` deployed on Aleo Testnet (Transaction ID in README)
- [ ] Shield Wallet integrated and working in `/compliance`
- [ ] All 3 Leo transitions working in browser via Web Worker
- [ ] Submission on Akindo includes:
  - Project name + description
  - Why privacy matters for this use case (GPS never on-chain)
  - PMF: DePIN operators needing regulatory compliance without location exposure
  - GTM: Target mining hardware operators and DePIN protocol teams
  - GitHub repo link
  - Progress changelog (first submission — describe what was built this wave)
