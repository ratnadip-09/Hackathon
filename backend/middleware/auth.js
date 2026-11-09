const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
module.exports = (req, res, next) => {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match)
    return res.status(401).json({ message: "Authentication required." });
  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!payload.id || !mongoose.isValidObjectId(payload.id))
      throw new Error("Invalid token subject");
    req.user = { id: payload.id };
    next();
  } catch {
    res.status(401).json({ message: "Please sign in again." });
  }
};
