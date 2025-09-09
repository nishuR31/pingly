import upkeeper from "../jobs/upkeeper.js";
import Monitor from "../models/monitor.model.js";
import ApiErrorResponse from "../utils/apiErrorResponse.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { restartCron, startCron, stopCron } from "../utils/cron.js";
import isEmpty from "../utils/isEmpty.js";
import json from "../utils/json.js";
import codes from "../utils/statusCodes.js";
import { red } from "../config/redis.js";

export let add = asyncHandler(async (req, res) => {
  let exist = json.parse(await red.hGet(`user:${process.env.KEY}`, "login"));
  let { url } = req.body;
  if (isEmpty([url])) {
    return res
      .status(codes.badRequest)
      .json(new ApiErrorResponse("Url is missing..", codes.badRequest));
  }

  let monitor = await Monitor.findOne({ url });
  if (monitor) {
    return res
      .status(codes.conflict)
      .json(
        new ApiErrorResponse("Monitor already exists.", codes.conflict).res()
      );
  }

  let newMonitor = await Monitor.create({
    url: url,
    interval: req.body?.interval ? req.body.interval : 5,
    userId: req.user?._id ?? exist?._id,
  });

  if (!newMonitor) {
    return res
      .status(codes.internalServerError)
      .json(
        new ApiErrorResponse(
          "Failed to create monitor.",
          codes.internalServerError
        ).res()
      );
  }

  startCron(newMonitor, upkeeper);

  return res.status(codes.ok).json(
    new ApiResponse("Monitor created successfully cron started.", codes.ok, {
      newMonitor,
    }).res()
  );
});

///////////////////////////////////////////////

export let del = asyncHandler(async (req, res) => {
  let id = req.params.id;
  let monitor = await Monitor.findByIdAndDelete(id);
  if (!monitor) {
    return res
      .status(codes.notFound)
      .json(new ApiErrorResponse("Monitor not found", codes.notFound).res());
  }
  stopCron(monitor._id);
  return res
    .status(codes.ok)
    .json(
      new ApiResponse(
        `Monitor and logs are deleted successfully`,
        codes.ok
      ).res()
    );
});

///////////////////////////////////////////////

export let edit = asyncHandler(async (req, res) => {
  let id = req.params.id;
  let { interval, active } = req.body;
  if (!(interval || active)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse("Some field is required.", codes.badRequest).res()
      );
  }

  let monitor = await Monitor.findById(id);
  if (!monitor) {
    return res
      .status(codes.notFound)
      .json(new ApiErrorResponse("Monitor not found", codes.notFound).res());
  }

  if (active) monitor.active = active;
  if (interval) monitor.interval = interval;
  await monitor.save();

  if (monitor.active) {
    restartCron(monitor, upkeeper);
  } else {
    stopCron(monitor._id);
  }

  // restartCron(monitor, upkeeper);
  return res.status(codes.ok).json(
    new ApiResponse("Monitor updated cron started.", codes.ok, {
      monitor,
    }).res()
  );
});
