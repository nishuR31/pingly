import cron from "node-cron";
import Monitor from "../models/monitor.model.js";
import Log from "../models/logs.model.js";
import ApiErrorResponse from "../utils/apiErrorResponse.js";
import isEmpty from "../utils/isEmpty.js";

async function controller() {
  let monitors = await Monitor.find();
  if (isEmpty(monitors)) {
    return new ApiErrorResponse("No monitors found.").res();
  }

  for (let monitor of monitors) {
    let result = await Log.deleteMany({ monitorId: monitor._id });
    if (!result.deletedCount) {
      console.log(`No logs found for monitor ${monitor._id}`);
    } else {
      console.log(
        `Deleted ${result.deletedCount} logs for monitor ${monitor._id}`
      );
    }
  }
}

let delLogs = async () => {
  // Run every Sunday at 00:00
  let task = cron.schedule(
    "0 0 * * 0",
    controller
    //     , {
    //     scheduled: false, // start manually
    //   }
  );

  console.log("Weekly log cleanup cron scheduled.");
  task.start(); // actually start the cron
  return task;
};

delLogs();
