import connect from "./src/config/connect.js";
import app from "./src/config/app.js";
import redis from "./src/config/redis.js";
import dotenv from "dotenv";

dotenv.config();

let port = process.env.PORT || 4321;

(async () => {
  try {
    await connect();
    await redis();
    app.listen(port, () => {
      console.log(`Server fired up on port : ${port}`);
    });
  } catch (err) {
    console.error(
      `Error occured firing up server or database or installing redis: ${err}`
    );
  }
})();
