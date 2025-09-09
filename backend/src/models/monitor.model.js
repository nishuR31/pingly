import mongoose from "mongoose";

const monitorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  url: { type: String, required: true },
  interval: { type: Number, default: 5, min: 5, max: 10 }, // minutes
  active: { type: Boolean, default: true },
});

// Monitor.js
monitorSchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) {
    await mongoose.model("Log").deleteMany({ monitorId: doc._id });
  }
  next();
});

export default mongoose.model("Monitor", monitorSchema);
