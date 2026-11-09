const axios = require('axios');
const Event = require('../models/Event');
const Alert = require('../models/Alert');

async function analyze(app) {
  const events = await Event.find({ app: app._id, user: app.user }).sort({ createdAt: -1 }).limit(50).lean();
  const { data } = await axios.post(`${process.env.DETECTION_URL}/analyze`, {
    app: { name: app.name, category: app.category, expected_permissions: app.expectedPermissions },
    events: events.map((e) => ({ resource: e.resource, authorized: e.authorized, timestamp: e.createdAt })),
  }, { timeout: 8000 });
  if (!Number.isInteger(data?.score) || data.score < 0 || data.score > 100 ||
      !['Trusted', 'Medium', 'Suspicious'].includes(data.band) ||
      !Array.isArray(data.alerts) || !Array.isArray(data.breakdown) || !Array.isArray(data.recommendations)) {
    throw new Error('Detection engine returned an invalid analysis response.');
  }
  app.trustScore = data.score;
  app.band = data.band;
  app.analysis = { breakdown: data.breakdown, recommendations: data.recommendations };
  await app.save();
  await Alert.deleteMany({ app: app._id, user: app.user });
  if (data.alerts.length) {
    await Alert.insertMany(data.alerts.map((a) => ({
      type: a.type, severity: a.severity, resource: a.resource, reason: a.reason,
      penalty: a.penalty, user: app.user, app: app._id,
    })));
  }
  return data;
}

async function recordAndAnalyze(app, resources) {
  const granted = new Set(app.permissions.filter((p) => p.granted).map((p) => p.resource));
  const now = Date.now();
  await Event.insertMany(resources.map((resource, i) => ({
    user: app.user, app: app._id, resource,
    authorized: granted.has(resource), simulated: true, createdAt: new Date(now + i),
  })));
  return analyze(app);
}

module.exports = { analyze, recordAndAnalyze };
