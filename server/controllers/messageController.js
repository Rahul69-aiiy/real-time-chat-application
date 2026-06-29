import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import Group from "../models/Group.js";
import {io, userSocketMap} from "../server.js"

// Get all users except the logged in user
export const getUsersForSidebar = async(req, res) => {
    try{
        const userId = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password")

        const userGroups = await Group.find({ members: userId })

        // count the number of messages not seen
        const unseenMessages = {}
        const promises = filteredUsers.map(async(user) => {
            const count = await Message.countDocuments({
                senderId: user._id,
                recieverId: userId,
                seen: false
            })
            if(count > 0) {
                unseenMessages[user._id] = count;
            }
        })

        const groupPromises = userGroups.map(async(group) => {
            const count = await Message.countDocuments({
                groupId: group._id,
                senderId: { $ne: userId },
                seenBy: { $ne: userId }
            })
            if(count > 0) {
                unseenMessages[group._id] = count;
            }
        })

        await Promise.all([...promises, ...groupPromises]); 
        res.json({success: true, users: filteredUsers, unseenMessages})
    } catch(error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

// Get all messages for selected user
export const getMessages = async(req, res) => {
    try {
        const {id: selectedUserId} = req.params;
        const myId =  req.user._id

        const messages = await Message.find({
            $or : [
                {senderId: myId, recieverId: selectedUserId},
                {senderId: selectedUserId, recieverId: myId},
            ]
        })

        await Message.updateMany({senderId: selectedUserId, recieverId: myId}, {seen: true})

        res.json({success: true, messages})
    } catch (error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

// api to mark message as seen using message id(individual messages)
export const markMessageAsSeen = async(req, res) => {
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id, {seen: true})
        res.json({success: true})
    } catch(error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

// send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const recieverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url
        }

        const newMessage = await Message.create({
            senderId,
            recieverId,
            text,
            image: imageUrl
        })
        
        // Emit the new message to the receiver's socket
        const recieverSocketId = userSocketMap[recieverId]
        if(recieverSocketId) {
            io.to(recieverSocketId).emit("newMessage", newMessage)
        }
        
        res.json({success: true, newMessage})
    } catch(error) {
        console.log(error.message)
        res.json({success: false, message: error.message})
    }
}

// Get all messages for selected group
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({ groupId });

        await Message.updateMany(
            { groupId, senderId: { $ne: myId }, seenBy: { $ne: myId } },
            { $addToSet: { seenBy: myId } }
        );

        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Send message to selected group
export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            groupId,
            text,
            image: imageUrl
        });

        // Broadcast to all users in the group room, except the sender
        const senderSocketId = userSocketMap[senderId.toString()];
        if (senderSocketId) {
            io.to(groupId).except(senderSocketId).emit("newMessage", newMessage);
        } else {
            io.to(groupId).emit("newMessage", newMessage);
        }

        res.json({ success: true, newMessage });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};