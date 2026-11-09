const { Schema, model } = require("mongoose");
module.exports = model(
  "Event",
  new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    app: { type: Schema.Types.ObjectId, ref: "App", index: true },
    resource: String,
    authorized: Boolean,
    simulated: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  }),
);
