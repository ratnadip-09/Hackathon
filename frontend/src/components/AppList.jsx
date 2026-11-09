import { TrustMeter } from './ui';

export default function AppList({ apps, selectedId, onSelect, onSeed }) {
  if (!apps.length) {
    return (
      <div className="bg-white border border-line rounded-lg p-6 text-center">
        <p className="font-medium">No apps are being monitored yet.</p>
        <p className="text-sm text-mute mt-1">Load the simulated sample apps to start.</p>
        <button onClick={onSeed} className="mt-4 rounded bg-signal text-white px-4 py-2 text-sm font-medium">Load sample apps</button>
      </div>
    );
  }
  return (
    <ul className="bg-white border border-line rounded-lg divide-y divide-line overflow-hidden">
      {apps.map((a) => (
        <li key={a._id}>
          <button onClick={() => onSelect(a._id)} aria-current={a._id === selectedId}
            className={`w-full text-left p-3 hover:bg-paper ${a._id === selectedId ? 'bg-paper border-l-4 border-signal' : 'border-l-4 border-transparent'}`}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium">{a.name}</span>
              <span className="text-mute">{a.category}</span>
            </div>
            <TrustMeter score={a.trustScore} band={a.band} />
          </button>
        </li>
      ))}
    </ul>
  );
}
