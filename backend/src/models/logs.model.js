import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  monitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Monitor",
    required: true,
  },
  status: { type: String, enum: ["up", "down"], required: true },
  responseTime: { type: Number, default: null },
  checkedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Log", logSchema);
