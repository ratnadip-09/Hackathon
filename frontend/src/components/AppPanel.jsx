import { useState } from 'react';
import { api } from '../services/api';
import { Panel, TrustMeter } from './ui';

const SCENARIOS = [
  ['normal', 'Normal access'],
  ['suspicious', 'Unrelated access'],
  ['repeated', 'Repeated attempts'],
  ['burst', 'Access burst'],
];

export default function AppPanel({ app, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn) => {
    setBusy(true); setError('');
    try { await fn(); await onChange(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const granted = (r) => app.permissions.find((p) => p.resource === r)?.granted;
  const { breakdown = [], recommendations = [] } = app.analysis || {};
  const btn = 'rounded border border-line bg-white px-3 py-1.5 text-sm hover:bg-paper disabled:opacity-50';

  return (
    <div className="space-y-4">
      <Panel title={app.name}>
        <p className="text-sm text-mute mb-3">
          Category: {app.category}. Expected access: {app.expectedPermissions.join(', ') || 'none'}.
        </p>
        <TrustMeter score={app.trustScore} band={app.band} large />
        <p className="text-xs text-mute mt-2">A heuristic estimate from simulated behaviour, not proof that an app is safe.</p>
      </Panel>

      <Panel title="Simulate activity (simulated)">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map(([key, label]) => (
            <button key={key} disabled={busy} className={btn} onClick={() => run(() => api.simulate(key, app._id))}>{label}</button>
          ))}
          <button disabled={busy} className={`${btn} text-mute`} onClick={() => run(() => api.resetApp(app._id))}>Reset history</button>
        </div>
        {error && <p role="alert" className="text-danger text-sm mt-2">{error}</p>}
      </Panel>

      <Panel title="Permissions">
        <ul className="divide-y divide-line">
          {app.permissions.map((p) => (
            <li key={p.resource} className="flex items-center justify-between py-2 text-sm">
              <span className="capitalize">{p.resource}
                {!app.expectedPermissions.includes(p.resource) && <span className="ml-2 text-xs text-caution">not expected</span>}
              </span>
              <button disabled={busy} className={btn}
                onClick={() => run(() => api.setPermission(app._id, p.resource, !p.granted))}>
                {p.granted ? 'Revoke' : 'Approve'}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Why this score">
        {breakdown.length === 0 ? <p className="text-sm text-mute">No penalties. Observed behaviour matches what the app is expected to do.</p> : (
          <ul className="text-sm space-y-2">
            {breakdown.map((b, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{b.detail}</span><span className="font-semibold text-danger whitespace-nowrap">−{b.penalty}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Recommendations">
        {recommendations.length === 0 ? <p className="text-sm text-mute">Nothing to review right now.</p> : (
          <ul className="text-sm space-y-3">
            {recommendations.map((r, i) => (
              <li key={i} className="flex items-center justify-between gap-3">
                <span>{r.reason}</span>
                {r.action === 'revoke' && granted(r.resource) && (
                  <button disabled={busy} className="rounded bg-danger text-white px-3 py-1.5 whitespace-nowrap"
                    onClick={() => run(() => api.setPermission(app._id, r.resource, false))}>Revoke {r.resource}</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {app.history?.length > 0 && (
        <Panel title="Changes you made">
          <ul className="text-sm text-mute space-y-1">
            {[...app.history].reverse().slice(0, 6).map((h, i) => (
              <li key={i}>{new Date(h.at).toLocaleTimeString()}: {h.action} {h.resource}</li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
