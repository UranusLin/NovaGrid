export const metadata = {
  title: 'Devices — NovaGrid',
};

type DeviceStatus = 'online' | 'offline' | 'pending';

type Device = {
  id: string;
  name: string;
  region: string;
  status: DeviceStatus;
  lastSeen: string;
  uptimePct: number;
  hashrateTHs: number;
  zkScore: number | null;
};

// Demo dataset — replaced by hardware relayer telemetry in Module B
const DEMO_DEVICES: Device[] = [
  {
    id: 'node-tw-01',
    name: 'Taiwan Node #1',
    region: 'Taiwan Approved Zone',
    status: 'online',
    lastSeen: '2m ago',
    uptimePct: 98,
    hashrateTHs: 520,
    zkScore: 87,
  },
  {
    id: 'node-jp-03',
    name: 'Japan Node #3',
    region: 'Japan Approved Zone',
    status: 'online',
    lastSeen: '5m ago',
    uptimePct: 94,
    hashrateTHs: 460,
    zkScore: 79,
  },
  {
    id: 'node-sg-07',
    name: 'Singapore Node #7',
    region: 'Singapore Approved Zone',
    status: 'pending',
    lastSeen: '18m ago',
    uptimePct: 71,
    hashrateTHs: 310,
    zkScore: null,
  },
  {
    id: 'node-tw-02',
    name: 'Taiwan Node #2',
    region: 'Taiwan Approved Zone',
    status: 'offline',
    lastSeen: '2h ago',
    uptimePct: 0,
    hashrateTHs: 0,
    zkScore: null,
  },
];

const STATUS_CONFIG: Record<DeviceStatus, { dot: string; label: string; text: string }> = {
  online: { dot: 'bg-emerald-400', label: 'Online', text: 'text-emerald-400' },
  offline: { dot: 'bg-red-500', label: 'Offline', text: 'text-red-400' },
  pending: { dot: 'bg-yellow-400 animate-pulse', label: 'Pending', text: 'text-yellow-400' },
};

function DeviceCard({ device }: { device: Device }) {
  const { dot, label, text } = STATUS_CONFIG[device.status];

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-200">{device.name}</p>
          <p className="text-xs text-gray-500">{device.region}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          <span className={`text-xs font-medium ${text}`}>{label}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-gray-800/50 px-2 py-2">
          <p className="text-xs text-gray-500">Uptime</p>
          <p className="mt-0.5 text-sm font-medium text-gray-300">
            {device.status === 'offline' ? '—' : `${device.uptimePct}%`}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800/50 px-2 py-2">
          <p className="text-xs text-gray-500">Hashrate</p>
          <p className="mt-0.5 text-sm font-medium text-gray-300">
            {device.status === 'offline' ? '—' : `${device.hashrateTHs} TH/s`}
          </p>
        </div>
        <div className="rounded-lg bg-gray-800/50 px-2 py-2">
          <p className="text-xs text-gray-500">ZK Score</p>
          <p className={`mt-0.5 text-sm font-medium ${device.zkScore !== null ? 'text-emerald-400' : 'text-gray-600'}`}>
            {device.zkScore !== null ? `${device.zkScore}/100` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-600">Last seen: {device.lastSeen}</span>
        {device.status !== 'offline' && (
          <a
            href="/compliance"
            className="text-xs text-emerald-600 hover:text-emerald-400 underline"
          >
            Generate proof →
          </a>
        )}
      </div>
    </div>
  );
}

export default function DevicesPage() {
  const online = DEMO_DEVICES.filter((d) => d.status === 'online').length;
  const total = DEMO_DEVICES.length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <a href="/" className="text-xs text-gray-500 hover:text-gray-300">
          ← Dashboard
        </a>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Devices</h1>
            <p className="mt-1 text-sm text-gray-500">
              Registered DePIN hardware nodes and their telemetry status.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {online}/{total} online
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {DEMO_DEVICES.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-gray-700">
        Live telemetry via hardware relayer coming in Module B
      </p>
    </main>
  );
}
