import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Panel, SEVERITY } from './ui';

export function UsageChart({ usage = [] }) {
  return (
    <Panel title="Permission usage">
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={usage}>
            <CartesianGrid stroke="#D5DBE0" vertical={false} />
            <XAxis dataKey="resource" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip /><Legend />
            <Bar dataKey="allowed" name="Allowed" stackId="a" fill="#0E7C86" />
            <Bar dataKey="blocked" name="Blocked" stackId="a" fill="#B42318" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function Timeline({ events }) {
  const buckets = {};
  [...events].reverse().forEach((e) => {
    const t = new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    buckets[t] = buckets[t] || { time: t, events: 0, blocked: 0 };
    buckets[t].events += 1;
    if (!e.authorized) buckets[t].blocked += 1;
  });
  return (
    <Panel title="Activity timeline (per minute)">
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={Object.values(buckets)}>
            <CartesianGrid stroke="#D5DBE0" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip /><Legend />
            <Line dataKey="events" name="Events" stroke="#0E7C86" strokeWidth={2} dot={false} />
            <Line dataKey="blocked" name="Blocked" stroke="#B42318" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export function AlertsPanel({ alerts }) {
  return (
    <Panel title={`Security alerts (${alerts.length})`}>
      {alerts.length === 0 ? <p className="text-sm text-mute">No alerts. Run a suspicious scenario to see one.</p> : (
        <ul className="space-y-3 max-h-72 overflow-auto">
          {alerts.map((a) => (
            <li key={a._id} className="text-sm flex gap-3">
              <span className={`h-fit rounded px-2 py-0.5 text-xs font-semibold ${SEVERITY[a.severity]}`}>{a.severity}</span>
              <span><strong>{a.app?.name}</strong>: {a.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function EventLog({ events }) {
  return (
    <Panel title="Recent access events (simulated)">
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-mute"><tr><th className="py-1">Time</th><th>App</th><th>Resource</th><th>Result</th></tr></thead>
          <tbody>
            {events.slice(0, 30).map((e) => (
              <tr key={e._id} className="border-t border-line">
                <td className="py-1 tabular-nums">{new Date(e.createdAt).toLocaleTimeString()}</td>
                <td>{e.app?.name}</td><td className="capitalize">{e.resource}</td>
                <td className={e.authorized ? 'text-ok' : 'text-danger font-medium'}>{e.authorized ? 'Allowed' : 'Blocked'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <p className="text-sm text-mute py-2">No events yet.</p>}
      </div>
    </Panel>
  );
}
