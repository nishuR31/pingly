import express from "express";
import { show } from "../controllers/logs.controller.js";

let logsRouter = express.Router();

logsRouter.get("/show/:id", show);

export default logsRouter;
