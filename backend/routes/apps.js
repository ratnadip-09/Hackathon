const router = require("express").Router();
const mongoose = require("mongoose");
const App = require("../models/App");
const Event = require("../models/Event");
const Alert = require("../models/Alert");
const sample = require("../services/sampleApps");
const { analyze } = require("../services/monitor");
const {
  wrap,
  RESOURCES,
  normalizePermissions,
  validText,
} = require("../services/util");

const mine = (req) => ({ user: req.user.id });
const perms = (granted) =>
  RESOURCES.map((resource) => ({
    resource,
    granted: granted.includes(resource),
  }));
const validId = (id) => mongoose.isValidObjectId(id);

router.get(
  "/",
  wrap(async (req, res) => {
    res.json(await App.find(mine(req)).sort({ trustScore: 1, name: 1 }).lean());
  }),
);

router.post(
  "/seed",
  wrap(async (req, res) => {
    const existing = new Set(
      (await App.find(mine(req)).select("name").lean()).map((a) => a.name),
    );
    const docs = sample
      .filter((s) => !existing.has(s.name))
      .map((s) => ({
        user: req.user.id,
        name: s.name,
        category: s.category,
        expectedPermissions: s.expected,
        permissions: perms(s.granted),
      }));
    if (docs.length) await App.insertMany(docs);
    res.json(await App.find(mine(req)).sort({ name: 1 }));
  }),
);

router.post(
  "/",
  wrap(async (req, res) => {
    const { name, category } = req.body || {};
    const expectedPermissions = normalizePermissions(
      req.body?.expectedPermissions ?? [],
    );
    const granted = normalizePermissions(req.body?.granted ?? []);
    if (
      !validText(name, 80) ||
      !validText(category, 40) ||
      !expectedPermissions ||
      !granted
    ) {
      return res
        .status(400)
        .json({
          message: "Provide a valid app name, category, and permission arrays.",
        });
    }
    const app = await App.create({
      user: req.user.id,
      name: name.trim(),
      category: category.trim().toLowerCase(),
      expectedPermissions,
      permissions: perms(granted),
    });
    // Persist a complete initial analysis rather than leaving an unanalysed app.
    await analyze(app);
    res.status(201).json(app);
  }),
);

router.patch(
  "/:id/permissions",
  wrap(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(400).json({ message: "Invalid app ID." });
    const { resource, granted } = req.body || {};
    if (!RESOURCES.includes(resource) || typeof granted !== "boolean") {
      return res
        .status(400)
        .json({
          message: "Provide a supported resource and a boolean granted value.",
        });
    }
    const app = await App.findOne({ _id: req.params.id, ...mine(req) });
    if (!app) return res.status(404).json({ message: "App not found." });
    const perm = app.permissions.find((p) => p.resource === resource);
    if (perm) perm.granted = granted;
    else app.permissions.push({ resource, granted });
    app.history.push({ action: granted ? "approved" : "revoked", resource });
    await app.save();
    // Permission state affects authorization and the trust score; refresh both now.
    await analyze(app);
    res.json(app);
  }),
);

router.delete(
  "/:id/events",
  wrap(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(400).json({ message: "Invalid app ID." });
    const app = await App.findOne({ _id: req.params.id, ...mine(req) });
    if (!app) return res.status(404).json({ message: "App not found." });
    await Event.deleteMany({ app: app._id, user: req.user.id });
    await analyze(app);
    res.json(app);
  }),
);

router.delete(
  "/:id",
  wrap(async (req, res) => {
    if (!validId(req.params.id))
      return res.status(400).json({ message: "Invalid app ID." });
    const app = await App.findOneAndDelete({
      _id: req.params.id,
      ...mine(req),
    });
    if (!app) return res.status(404).json({ message: "App not found." });
    await Promise.all([
      Event.deleteMany({ app: app._id, user: req.user.id }),
      Alert.deleteMany({ app: app._id, user: req.user.id }),
    ]);
    res.json({ ok: true });
  }),
);

module.exports = router;
