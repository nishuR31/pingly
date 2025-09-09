import cron from "node-cron";

const jobStore = new Map(); // keeps track of running jobs

/**
 * Start a cron task for a monitor
 */
export function startCron(monitor, fn) {
  stopCron(monitor._id); // prevent duplicates

  const cronExpr = `*/${monitor.interval || 5} * * * *`;

  const task = cron.schedule(cronExpr, async () => {
    try {
      await fn(monitor);
    } catch (err) {
      console.error(`Task error for monitor ${monitor._id}:`, err.message);
    }
  });

  task.start();
  jobStore.set(monitor._id.toString(), task);

  console.log(`Cron started for monitor ${monitor._id} @ ${cronExpr}`);
  return task;
}

/**
 * Stop a cron task
 */
export function stopCron(monitorId) {
  const task = jobStore.get(monitorId.toString());
  if (task) {
    task.stop();
    jobStore.delete(monitorId.toString());
    console.log(`Cron stopped for monitor ${monitorId}`);
  }
}

/**
 * Restart a cron task
 */
export function restartCron(monitor, fn) {
  stopCron(monitor._id);
  return startCron(monitor, fn);
}

/**
 * On app boot: restore all active jobs
 */
export async function upkeepAll(MonitorModel, fn) {
  const monitors = await MonitorModel.find({ active: true });
  for (const monitor of monitors) {
    startCron(monitor, fn);
  }
}
