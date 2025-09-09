import axios from "axios";
import Log from "../models/logs.model.js";

const upkeeper = async (monitor) => {
  console.log(`Checking uptime for ${monitor.url}...`);
  const start = Date.now();

  try {
    await axios.get(monitor.url, { timeout: 5000 });
    const responseTime = Date.now() - start;

    await Log.create({
      monitorId: monitor._id,
      status: "up",
      responseTime,
    });
  } catch (err) {
    await Log.create({
      monitorId: monitor._id,
      status: "down",
      error: err.message,
    });
    console.error(`Monitor ${monitor.url} is DOWN:`, err.message);
  }
};

export default upkeeper;
