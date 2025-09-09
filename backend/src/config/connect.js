import mongoose from "mongoose";

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Mongo fired up successfully");
  } catch (err) {
    console.error(`MongoDB extinguished successfully:${err}`);
  }
}

export default connect;
