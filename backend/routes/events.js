const router = require("express").Router();
const mongoose = require("mongoose");
const App = require("../models/App");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const { recordAndAnalyze } = require("../services/monitor");
const { wrap, pick, RESOURCES } = require("../services/util");

router.get(
  "/events",
  wrap(async (req, res) => {
    const q = { user: req.user.id };
    if (req.query.app) {
      if (!mongoose.isValidObjectId(req.query.app))
        return res.status(400).json({ message: "Invalid app ID." });
      q.app = req.query.app;
    }
    const parsed = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsed)
      ? Math.max(1, Math.min(parsed, 200))
      : 50;
    res.json(
      await Event.find(q)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("app", "name")
        .lean(),
    );
  }),
);

router.get(
  "/alerts",
  wrap(async (req, res) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const alerts = await Alert.find({ user: req.user.id })
      .populate("app", "name")
      .sort({ createdAt: -1 })
      .lean();
    res.json(
      alerts.sort(
        (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9),
      ),
    );
  }),
);

// All events are explicitly simulated; no device-level permissions are inspected.
router.post(
  "/simulate",
  wrap(async (req, res) => {
    const { appId, scenario = "random" } = req.body || {};
    const allowedModes = [
      "normal",
      "suspicious",
      "repeated",
      "burst",
      "random",
    ];
    if (!allowedModes.includes(scenario))
      return res.status(400).json({ message: "Unknown scenario." });
    if (appId && !mongoose.isValidObjectId(appId))
      return res.status(400).json({ message: "Invalid app ID." });
    const apps = appId
      ? await App.find({ _id: appId, user: req.user.id })
      : await App.find({ user: req.user.id });
    if (!apps.length)
      return res
        .status(404)
        .json({ message: "No apps found. Load sample apps first." });
    const app = pick(apps);
    const granted = new Set(
      app.permissions.filter((p) => p.granted).map((p) => p.resource),
    );
    const revoked = RESOURCES.filter((r) => !granted.has(r));
    const unexpected = RESOURCES.filter(
      (r) => !app.expectedPermissions.includes(r),
    );
    const unexpectedGranted = unexpected.filter((r) => granted.has(r));
    const mode =
      scenario === "random"
        ? Math.random() < 0.8
          ? "normal"
          : "suspicious"
        : scenario;
    let resources;
    switch (mode) {
      case "normal": {
        const expectedGranted = app.expectedPermissions.filter((r) =>
          granted.has(r),
        );
        if (!expectedGranted.length)
          return res
            .status(409)
            .json({
              message:
                "Grant at least one expected permission before simulating normal access.",
            });
        resources = [pick(expectedGranted)];
        break;
      }
      case "suspicious":
        if (!unexpected.length)
          return res
            .status(409)
            .json({ message: "This app has no unexpected resources to test." });
        resources = [
          pick(unexpectedGranted.length ? unexpectedGranted : unexpected),
        ];
        break;
      case "repeated":
        if (!revoked.length)
          return res
            .status(409)
            .json({
              message:
                "Revoke at least one permission before testing repeated blocked attempts.",
            });
        resources = Array(3).fill(pick(revoked));
        break;
      case "burst": {
        const expectedGranted = app.expectedPermissions.filter((r) =>
          granted.has(r),
        );
        if (!expectedGranted.length)
          return res
            .status(409)
            .json({
              message:
                "Grant at least one expected permission before simulating an access burst.",
            });
        resources = Array.from({ length: 12 }, () => pick(expectedGranted));
        break;
      }
      default:
        return res.status(400).json({ message: "Unknown scenario." });
    }
    const result = await recordAndAnalyze(app, resources);
    res.json({
      app: app.name,
      mode,
      resources,
      score: result.score,
      band: result.band,
      simulated: true,
    });
  }),
);

router.get(
  "/dashboard",
  wrap(async (req, res) => {
    const user = new mongoose.Types.ObjectId(req.user.id);
    const [apps, suspicious, events, alerts, usage] = await Promise.all([
      App.countDocuments({ user }),
      App.countDocuments({ user, band: "Suspicious" }),
      Event.countDocuments({ user }),
      Alert.countDocuments({ user }),
      Event.aggregate([
        { $match: { user } },
        {
          $group: {
            _id: "$resource",
            allowed: { $sum: { $cond: ["$authorized", 1, 0] } },
            blocked: { $sum: { $cond: ["$authorized", 0, 1] } },
          },
        },
      ]),
    ]);
    const byRes = Object.fromEntries(usage.map((u) => [u._id, u]));
    res.json({
      monitoredApps: apps,
      suspiciousApps: suspicious,
      accessEvents: events,
      securityAlerts: alerts,
      usage: RESOURCES.map((r) => ({
        resource: r,
        allowed: byRes[r]?.allowed || 0,
        blocked: byRes[r]?.blocked || 0,
      })),
    });
  }),
);

module.exports = router;
