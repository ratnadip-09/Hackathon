const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { wrap, validText } = require("../services/util");
const rateLimit = require("../middleware/rateLimit");
const authAttemptLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

const sign = (u) =>
  jwt.sign({ id: u._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
const view = (u) => ({ id: u._id, name: u.name, email: u.email });
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post(
  "/register",
  authAttemptLimit,
  wrap(async (req, res) => {
    const { name, email, password } = req.body || {};
    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (
      !validText(name, 80) ||
      !emailPattern.test(normalizedEmail) ||
      normalizedEmail.length > 254 ||
      typeof password !== "string" ||
      password.length < 10 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res
        .status(400)
        .json({
          message:
            "Enter a name, valid email, and password of at least 10 characters and no more than 72 UTF-8 bytes.",
        });
    }
    if (await User.findOne({ email: normalizedEmail })) {
      return res
        .status(409)
        .json({
          message: "That email is already registered. Sign in instead.",
        });
    }
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: sign(user), user: view(user) });
  }),
);

router.post(
  "/login",
  authAttemptLimit,
  wrap(async (req, res) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    const password =
      typeof req.body?.password === "string" &&
      Buffer.byteLength(req.body.password, "utf8") <= 72
        ? req.body.password
        : "";
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    }
    res.json({ token: sign(user), user: view(user) });
  }),
);

router.get(
  "/me",
  auth,
  wrap(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(401).json({ message: "Please sign in again." });
    res.json({ user: view(user) });
  }),
);

module.exports = router;
