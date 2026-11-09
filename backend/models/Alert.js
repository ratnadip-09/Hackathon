const { Schema, model } = require("mongoose");
module.exports = model(
  "Alert",
  new Schema(
    {
      user: { type: Schema.Types.ObjectId, ref: "User", index: true },
      app: { type: Schema.Types.ObjectId, ref: "App", index: true },
      type: String,
      severity: String,
      resource: String,
      reason: String,
      penalty: Number,
    },
    { timestamps: true },
  ),
);
