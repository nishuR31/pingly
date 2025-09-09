import Log from "../models/logs.model.js";
import Monitor from "../models/monitor.model.js";
import ApiErrorResponse from "../utils/apiErrorResponse.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import isEmpty from "../utils/isEmpty.js";
import codes from "../utils/statusCodes.js";

export let show = asyncHandler(async (req, res) => {
  let id = req.param.id;
  let monitor = await Monitor.findById(id);
  if (!monitor) {
    return res
      .status(codes.notFound)
      .json(new ApiErrorResponse("Monitor not found", codes.notFound).res());
  }
  let logs = await Log.findMany({ monitorId: id });
  if (isEmpty(logs)) {
    return res
      .status(codes.notFound)
      .json(
        new ApiErrorResponse(
          "No logs found. May be auto erased.",
          codes.notFound
        ).res()
      );
  }

  return res
    .status(codes.ok)
    .json(new ApiResponse("Logs found for", codes.ok, { logs }).res());
});



