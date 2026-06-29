import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { createGroup, getGroups, updateGroup } from "../controllers/groupController.js";

const groupRouter = express.Router();

groupRouter.post("/", protectRoute, createGroup);
groupRouter.get("/", protectRoute, getGroups);
groupRouter.put("/:groupId", protectRoute, updateGroup);

export default groupRouter;
