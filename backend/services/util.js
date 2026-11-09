// Shared API helpers and the only permission vocabulary accepted by the API.
exports.wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.RESOURCES = ['camera', 'location', 'contacts', 'microphone', 'storage'];
exports.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
exports.normalizePermissions = (value) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !exports.RESOURCES.includes(item))) return null;
  if (new Set(value).size !== value.length) return null;
  return value;
};
exports.validText = (value, max = 80) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
