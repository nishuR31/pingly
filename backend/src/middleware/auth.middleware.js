import codes from "../utils/statusCodes.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiErrorResponse from "../utils/apiErrorResponse.js";
import { verifyAccess, verifyRefresh } from "../utils/tokenGenerator.js";
import User from "../models/user.model.js";

let auth = (need = true) =>
  asyncHandler(async (req, res, next) => {
    let accessToken = req.header.authorization
      ? req.header.authorization.split(" ")[1]
      : req.cookies.accessToken;
    let apiKey = req.headers["x-api-key"] ?? null;
    let refreshToken = req.cookies.refreshToken;

    req.user = null;
    let userApiKey = await User.findOne({ apiKey });
    if (!accessToken || !refreshToken || !userApiKey) {
      return need
        ? res
            .status(codes.unauthorized)
            .json(
              new ApiErrorResponse(
                "Auth tokens or api not provided",
                codes.unauthorized
              ).res()
            )
        : next();
    }

    let decodedAccess, decodedRefresh;
    if (accessToken) {
      decodedAccess = verifyAccess(accessToken);
    }
    if (!decodedAccess) {
      return need
        ? res
            .status(codes.unauthorized)
            .json(
              new ApiErrorResponse(
                "Invalid access token",
                codes.unauthorized
              ).res()
            )
        : next();
    }

    if (refreshToken) {
      decodedRefresh = verifyRefresh(refreshToken);
    }
    if (!decodedRefresh) {
      return need
        ? res
            .status(codes.unauthorized)
            .json(
              new ApiErrorResponse(
                "Invalid refresh token",
                codes.unauthorized
              ).res()
            )
        : next();
    }

    if (decodedAccess._id !== decodedRefresh._id) {
      return need
        ? res
            .status(codes.unauthorized)
            .json(
              new ApiErrorResponse(
                "Auth tokens mismatch.",
                codes.unauthorized
              ).res()
            )
        : next();
    }

    let user = await User.findById(decodedAccess._id);

    let payload = { userName: user.userName, _id: user._id };

    req.user = payload;
    next();
  });

export default auth;
