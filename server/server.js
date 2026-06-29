import dotenv from "dotenv";

if(process.env.NODE_ENV != "production") {
    dotenv.config();
}

import express from "express"
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRoutes.js";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;

// Create Express app and HTTP server
const app = express()
const server = http.createServer(app)

// Initializing socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// Store online users
export const userSocketMap = {}; // {userId: socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId)

    if(userId) userSocketMap[userId] = socket.id;

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    // Group Chat events
    socket.on("joinGroupRooms", (groupIds) => {
        if (Array.isArray(groupIds)) {
            groupIds.forEach(id => socket.join(id.toString()));
        }
    });

    // Video Call events
    socket.on("callUser", ({ from, to, roomId }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("incomingCall", { from, roomId });
        }
    });

    socket.on("declineCall", ({ to }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("callDeclined");
        }
    });

    socket.on("acceptCall", ({ to, roomId }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("callAccepted", { roomId });
        }
    });

    socket.on("endCall", ({ to }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("callEnded");
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId)
        delete userSocketMap[userId]
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({limit: "4mb"}));
app.use(cors())

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)
app.use("/api/groups", groupRouter)

// Connect to MongoDB
await connectDB();

server.listen(PORT, () => console.log("Server is running on PORT: " + PORT))