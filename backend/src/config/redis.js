import { createClient } from "redis";
let red;

export default async function redis() {
  try {
    if (red) return red; // reuse if already connected
    red = createClient({ url: process.env.REDIS });
    red.on("error", (err) => {
      console.log(`Redis threw error while running: ${err}`);
    });
    await red.connect();
    console.log("Redis installed successfully.");
  } catch (err) {
    console.log(`Error while redis connecting: ${err}`);
  }
}

export { red };
