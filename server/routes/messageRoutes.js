import express from "express"
import { protectRoute } from "../middleware/auth.js"
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, getGroupMessages, sendGroupMessage } from "../controllers/messageController.js"

const messageRouter = express.Router()

messageRouter.get("/users", protectRoute, getUsersForSidebar)
messageRouter.get("/group/:groupId", protectRoute, getGroupMessages)
messageRouter.post("/group/send/:groupId", protectRoute, sendGroupMessage)
messageRouter.get("/:id", protectRoute, getMessages)
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen)
messageRouter.post("/send/:id", protectRoute, sendMessage)

export default messageRouter;