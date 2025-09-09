import mongoose from "mongoose";
import required from "../utils/required.js";
import bcrypt from "bcrypt";
let userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: [true, required("username")],
      trim: true,
      lowercase: true,
    },
    apiKey: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: [true, required("firstname")],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, required("email")],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, required("password")],
      trim: true,
      // select:false
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    occupation: {
      type: String,
      trim: true,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },

    refreshToken: { type: String },
    otp: {
      code: { type: String },
      verified: { type: Boolean },
      expiry: { type: Date },
    },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    facebook: { type: String, default: "" },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.pre("findByIdAndUpdate", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.pre("findOneAndUpdate", async function (next) {
  let update = this.getUpdate();

  if (update.password) {
    let hashed = await bcrypt.hash(update.password, 10);
    this.setUpdate({ ...update, password: hashed });
  }
  next();
});

let User = mongoose.model("User", userSchema);
export default User;
