// Lightweight per-process limiter for this single-instance prototype.
// Use a shared store (e.g. Redis) when running multiple backend instances.
const buckets = new Map();
module.exports = ({ windowMs = 15 * 60 * 1000, max = 10 } = {}) => (req, res, next) => {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  let entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) entry = { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  buckets.set(key, entry);
  res.setHeader('RateLimit-Limit', max);
  res.setHeader('RateLimit-Remaining', Math.max(0, max - entry.count));
  res.setHeader('RateLimit-Reset', Math.ceil(entry.resetAt / 1000));
  if (entry.count > max) return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
  // Periodically remove expired entries to keep memory bounded.
  if (buckets.size > 1000) {
    for (const [ip, item] of buckets) if (item.resetAt <= now) buckets.delete(ip);
  }
  next();
};
