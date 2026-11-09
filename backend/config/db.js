const mongoose = require("mongoose");
module.exports = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected");
};
