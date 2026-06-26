import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { createGroup, getGroups } from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/", protectRoute, createGroup);
groupRouter.get("/", protectRoute, getGroups);

export default groupRouter;
