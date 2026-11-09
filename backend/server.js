require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const auth = require("./middleware/auth");

const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.disable("x-powered-by");
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
  }),
);
app.use(express.json({ limit: "100kb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/apps", auth, require("./routes/apps"));
app.use("/api", auth, require("./routes/events"));
app.use((err, _req, res, _next) => {
  // Keep internal errors out of API responses; retain useful server-side diagnostics.
  console.error(err);
  if (err.type === "entity.parse.failed")
    return res.status(400).json({ message: "Invalid JSON request body." });
  if (err.name === "ValidationError")
    return res.status(400).json({ message: "The supplied data is invalid." });
  if (err.code === 11000)
    return res.status(409).json({ message: "That record already exists." });
  const down = ["ECONNREFUSED", "ECONNABORTED", "ETIMEDOUT"].includes(err.code);
  res.status(down ? 503 : 500).json({
    message: down
      ? "A required service is unavailable. Check MongoDB and the detection engine."
      : "Something went wrong on the server.",
  });
});

const port = Number(process.env.PORT) || 5000;
async function start() {
  if (!process.env.MONGO_URI)
    throw new Error(
      "MONGO_URI is required. Copy .env.example to .env and configure it.",
    );
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.toLowerCase().includes("replace-with") ||
    process.env.JWT_SECRET === "change-this-to-a-long-random-string"
  ) {
    throw new Error(
      "Set JWT_SECRET to a unique random value of at least 32 characters.",
    );
  }
  if (!process.env.DETECTION_URL) throw new Error("DETECTION_URL is required.");
  await connectDB();
  app.listen(port, () => console.log(`API running on :${port}`));
}
start().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exit(1);
});
