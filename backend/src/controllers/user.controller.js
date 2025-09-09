import User from "../models/user.model.js";

import ApiErrorResponse from "../utils/apiErrorResponse.js";
import { red } from "../config/redis.js";
import ApiResponse from "../utils/apiResponse.js";
import time from "../utils/time.js";
import codes from "../utils/statusCodes.js";
import hideEmail from "../utils/hideEmail.js";
import isEmpty from "../utils/isEmpty.js";
import { tokens } from "../utils/tokenGenerator.js";
import cookieOptions from "../utils/cookieOptions.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import json from "../utils/json.js";

export let register = asyncHandler(async (req, res) => {
  let { firstName, lastName, email, password, userName } = req.body;
  if (isEmpty([email, password, userName])) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse("All fields are required", codes.badRequest).res()
      );
  }

  let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse("Invalid email format.", codes.badRequest).res()
      );
  }

  if (password.length < 8) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Password must be atleast 8 characters long.",
          codes.badRequest
        ).res()
      );
  }

  if (!/d/.test(password)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Password must have a digit [1,2...].",
          codes.badRequest
        ).res()
      );
  }

  if (!/[a-z]/.test(password)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Password must have a lowercase character [a-z].",
          codes.badRequest
        ).res()
      );
  }

  if (!/[A-Z]/.test(password)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Password must have an uppercase character [A-Z].",
          codes.badRequest
        ).res()
      );
  }

  if (/s/.test(password)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Password must not have any spaces between.",
          codes.badRequest
        ).res()
      );
  }

  if (!/W/.test(password)) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Password must have a symbol [!,@...].",
          codes.badRequest
        ).res()
      );
  }

  let existingEmail = await User.findOne({ email });

  if (existingEmail) {
    return res
      .status(codes.conflict)
      .json(
        new ApiErrorResponse("Email already exists.", codes.conflict).res()
      );
  }

  let existingUsername = await User.findOne({ userName });

  if (existingUsername) {
    return res
      .status(codes.conflict)
      .json(
        new ApiErrorResponse(
          `Account with username : ${userName} already exists`,
          codes.conflict
        ).res()
      );
  }

  // await User.create({
  //   firstName,
  //   lastName,
  //   email,
  //   password,
  //   userName,
  // });
  let user = await User.create(req.body);
  if (!user) {
    return res
      .status(codes.internalServerError)
      .json(
        new ApiErrorResponse(
          "Registration failed, please retry.",
          codes.internalServerError
        ).res()
      );
  }

  return res.status(codes.created).json(
    new ApiResponse(
      "Account created and registered successfully,please return to login",
      codes.created,
      {
        userName: user.userName,
        email: hideEmail(user.email),
        photoUrl: user.photoUrl,
      }
    ).res()
  );
});

/////////////////////////////////////////////////////////////////

export let login = asyncHandler(async (req, res) => {
  let exist = json.parse(await red.hGet(`user:${user._id}`, "login"));
  if (req.user || exist) {
    return res.status(codes.ok).json(
      new ApiResponse(
        "User already logged in,try logging out before login again.",
        codes.ok,
        {
          user: {
            _id: req.user._id ?? exist._id,
            userName: req.user.userName ?? exist.userName,
          },
        }
      ).res()
    );
  }
  let { emailUser, password } = req.body;
  if (!emailUser && !password) {
    return res
      .status(codes.badRequest)
      .json(
        new ApiErrorResponse(
          "Username or email required with password.",
          codes.badRequest
        ).res()
      );
  }

  let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/;
  let field = emailRegex.test(emailUser) ? "email" : "userName";

  let user = await User.findOne({ $or: [{ [field]: emailUser }] });
  // let user = await User.findOne({ $or: [{ [field]: emailUser }] }).select(" -refreshToken -otp ");
  if (!user) {
    return res
      .status(codes.notFound)
      .json(
        new ApiErrorResponse(
          "Account with credentials do not exist, try registering.",
          codes.notFound
        ).res()
      );
  }

  if (!user.comparePassword(password)) {
    return res
      .status(codes.conflict)
      .json(new ApiErrorResponse("Password mismatch.", codes.conflict).res());
  }

  let payload = { _id: user._id, userName: user.userName };
  let { accessToken, refreshToken } = tokens(payload);
  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, cookieOptions("access"));
  res.cookie("refreshToken", refreshToken, cookieOptions("refresh"));
  await red.hSet(
    `user:${user._id}`,
    "login",
    json.str({ userName: user.userName, _id: user._id })
  ); //1day
  return res.status(codes.ok).json(
    new ApiResponse(
      `Welcome back ${user.userName}. Logging you in.`,
      codes.ok,
      {
        user: {
          _id: user._id,
          userName: user.userName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          bio: user.bio,
          occupation: user.occupation,
          photoUrl: user.photoUrl,
          instagram: user.instagram,
          linkedin: user.linkedin,
          github: user.github,
          facebook: user.facebook,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken: accessToken,
      }
    ).res()
  );
});

////////////////////////////////////////////////////////////////////////////

export let profile = asyncHandler(async (req, res) => {
  let id = req.params.id;
  let exist = json.parse(await red.hGet(`user:${user._id}`, "profile"));
  if (exist) {
    return res.status(codes.ok).json(
      new ApiResponse(`User ${user.userName} found successfully.`, codes.ok, {
        user: {
          _id: exist._id,
          userName: exist.userName,
          firstName: exist.firstName,
          lastName: exist.lastName,
          email: exist.email,
          bio: exist.bio,
          occupation: exist.occupation,
          photoUrl: exist.photoUrl,
          instagram: exist.instagram,
          linkedin: exist.linkedin,
          github: exist.github,
          facebook: exist.facebook,
          createdAt: exist.createdAt,
          updatedAt: exist.updatedAt,
        },
      }).res()
    );
  }

  let user = await User.findById(id);
  if (!user) {
    return res
      .status(codes.notFound)
      .json(new ApiErrorResponse("No user found.", codes.notFound).res());
  }
  await red.hSet(
    `user:${user._id}`,
    "profile",
    json.str({
      _id: user._id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      occupation: user.occupation,
      photoUrl: user.photoUrl,
      instagram: user.instagram,
      linkedin: user.linkedin,
      github: user.github,
      facebook: user.facebook,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  );
  return res.status(codes.ok).json(
    new ApiResponse(`User ${user.userName} found successfully.`, codes.ok, {
      user: {
        _id: user._id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bio: user.bio,
        occupation: user.occupation,
        photoUrl: user.photoUrl,
        instagram: user.instagram,
        linkedin: user.linkedin,
        github: user.github,
        facebook: user.facebook,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }).res()
  );
});
/////////////////////////////////////////////////////////////
export let logout = asyncHandler(async (req, res) => {
  // let exist=json.parse(await red.hGet(`user:${user._id}`,"login))
  for (let cookie in req.cookies) {
    res.clearCookie(cookie, {
      httpOnly: true,
      path: "/",
      secure: true,
      sameSite: "None",
    });
  }

  const keys = await red.keys("user:*");
  if (keys) {
    let delKeys = keys.filter((key) => key !== "user:0000");
    // await Promise.all(delKeys.map(key=>red.del(key)))
    await red.del(...delKeys);
  }

  return res
    .status(codes.ok)
    .json(new ApiResponse(`User successfully logged out.`, codes.ok).res());
});

///////////////////////////////////////////////

export let updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res
      .status(codes.unauthorized)
      .json(
        new ApiErrorResponse(
          "User not authorized,please login before updating profile.",
          codes.unauthorized
        ).res()
      );
  }

  let {
    firstName,
    email,
    lastName,
    occupation,
    bio,
    facebook,
    linkedin,
    github,
    instagram,
  } = req.body;

  let user = await User.findById(req.user._id).select(
    "-password -refreshToken -otp"
  );

  if (!req.user._id) {
    return res
      .status(codes.notFound)
      .json(
        new ApiErrorResponse("User Account not found.", codes.notFound).res()
      );
  }

  // Update fields if changed
  if (firstName && user.firstName !== firstName) {
    user.firstName = firstName;
  }
  if (email && user.email !== email) {
    user.email = email;
  }
  if (lastName !== undefined && user.lastName !== lastName) {
    user.lastName = lastName;
  }
  if (occupation !== undefined && user.occupation !== occupation) {
    user.occupation = occupation
      ? occupation
          .split(" ")
          .map((e, i) => e[0].toUpperCase() + e.slice(1))
          .join(" ")
      : "";
  }
  if (bio !== undefined && user.bio !== bio) {
    user.bio = bio;
  }
  if (instagram !== undefined && user.instagram !== instagram) {
    user.instagram = instagram;
  }
  if (facebook !== undefined && user.facebook !== facebook) {
    user.facebook = facebook;
  }
  if (linkedin !== undefined && user.linkedin !== linkedin) {
    user.linkedin = linkedin;
  }
  if (github !== undefined && user.github !== github) {
    user.github = github;
  }

  if (req.file?.url !== undefined && user.photoUrl !== req.file.url) {
    user.photoUrl = req.file.url;
  }

  await user.save();
  await red.hSet(
    `user:${user._id}`,
    "profile",
    json.parse({
      _id: user._id,
      userName: user.userName,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      occupation: user.occupation,
      photoUrl: user.photoUrl,
      instagram: user.instagram,
      linkedin: user.linkedin,
      github: user.github,
      facebook: user.facebook,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  );
  return res.status(codes.ok).json(
    new ApiResponse("User profile successfully updated", codes.ok, {
      user: user,
    }).res()
  );
});

///////////////////////////////////////////////////

export let getAllUsers = asyncHandler(async (req, res) => {
  let exists = await red.hGet(`user:0000`, "allUsers");
  if (exists) {
    let exist = json.parse(exists);
    return res.status(codes.ok).json(
      new ApiResponse("Users successfully found", codes.ok, {
        totalUsers: exist?.length,
        users: exist ?? [],
      }).res()
    );
  }
  let users = await User.find().select("-password -otp -refreshToken");
  // exclude password field
  await red.hSet(
    `user:0000`,
    "allUsers",
    json.str({
      totalUsers: users?.length,
      users: users ?? [],
    })
  );

  return res.status(codes.ok).json(
    new ApiResponse("Users successfully found", codes.ok, {
      totalUsers: users?.length,
      users: users ?? [],
    }).res()
  );
});

export let del = asyncHandler(async (req, res) => {
  let exist = json.parse(await red.hGet(`user:${process.env.KEY}`, "login"));
  let user = await User.findByIdAndDelete(req.user._id ?? exist._id);
  if (!user) {
    return res
      .status(codes.notFound)
      .json(new ApiErrorResponse("User not found.", codes.notFound).res());
  }

  let keys = await red.get(`user:*`);
  if (keys) {
    let delkeys = keys.filter((key) => key !== "user:0000");
    await red.del(...delkeys);
  }

  return res
    .status(codes.ok)
    .json(new ApiResponse("Users successfully deleted", codes.ok).res());
});
