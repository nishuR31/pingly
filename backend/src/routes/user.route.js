import express from "express";
import {
  del,
  getAllUsers,
  login,
  logout,
  profile,
  register,
  updateProfile,
} from "../controllers/user.controller.js";
import auth from "../middleware/auth.middleware.js";

let userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", auth(false), login);
userRouter.get("/profile/:id", profile);
userRouter.get("/logout", logout);
userRouter.patch("/update", auth(true), updateProfile);
userRouter.get("/users", getAllUsers);
userRouter.delete("/del", del);

export default userRouter;
