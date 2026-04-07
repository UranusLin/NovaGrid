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
              <span className="text-xl" role="img" aria-label={layer.name}>
                {layer.icon}
              </span>
              <div>
                <span className="text-sm font-medium text-gray-200">{layer.name}</span>
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
