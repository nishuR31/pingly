import express from "express";
import { add, del, edit } from "../controllers/monitor.controller.js";

let monitorRouter = express.Router();

monitorRouter.post("/add", add);
monitorRouter.delete("/del/:id", del);
monitorRouter.patch("/edit/:id", edit);

export default monitorRouter;
