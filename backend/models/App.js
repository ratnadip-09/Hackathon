const { Schema, model } = require("mongoose");
module.exports = model(
  "App",
  new Schema(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      name: { type: String, required: true },
      category: { type: String, required: true },
      expectedPermissions: [String],
      permissions: [{ _id: false, resource: String, granted: Boolean }],
      trustScore: { type: Number, default: 100 },
      band: { type: String, default: "Trusted" },
      analysis: {
        type: Schema.Types.Mixed,
        default: { breakdown: [], recommendations: [] },
      },
      history: [
        {
          _id: false,
          action: String,
          resource: String,
          at: { type: Date, default: Date.now },
        },
      ],
    },
    { timestamps: true },
  ),
);
