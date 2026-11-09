export const BAND = {
  Trusted:    { text: 'text-ok',      bar: 'bg-ok' },
  Medium:     { text: 'text-caution', bar: 'bg-caution' },
  Suspicious: { text: 'text-danger',  bar: 'bg-danger' },
};
export const SEVERITY = {
  critical: 'bg-danger text-white',
  high: 'bg-danger/15 text-danger',
  medium: 'bg-caution/15 text-caution',
};

// The trust meter: the one memorable element of the dashboard.
export function TrustMeter({ score, band, large }) {
  const c = BAND[band] || BAND.Trusted;
  const safeScore = Number.isFinite(Number(score)) ? Math.max(0, Math.min(100, Number(score))) : 0;
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className={`${large ? 'text-4xl' : 'text-lg'} font-bold tabular-nums ${c.text}`}>{safeScore}</span>
        <span className={`text-sm font-medium ${c.text}`}>{band}</span>
      </div>
      <div className={`mt-1 rounded-full bg-line overflow-hidden ${large ? 'h-3' : 'h-1.5'}`}
           role="meter" aria-valuenow={safeScore} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${c.bar} transition-all duration-500`} style={{ width: `${safeScore}%` }} />
      </div>
    </div>
  );
}

export const Panel = ({ title, children, action }) => (
  <section className="bg-white border border-line rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold">{title}</h2>{action}
    </div>
    {children}
  </section>
);
