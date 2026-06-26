import Group from "../models/Group.js";
import cloudinary from "../lib/cloudinary.js";

// Create a new group room
export const createGroup = async (req, res) => {
    try {
        const { name, members, description, profilePic } = req.body;
        const creatorId = req.user._id;

        if (!name) {
            return res.json({ success: false, message: "Group name is required" });
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return res.json({ success: false, message: "At least one member must be selected" });
        }

        // Combine creator and selected members, ensuring uniqueness
        const uniqueMembers = Array.from(new Set([...members, creatorId.toString()]));

        let imageUrl = "";
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            imageUrl = uploadResponse.secure_url;
        }

        const newGroup = await Group.create({
            name,
            creatorId,
            members: uniqueMembers,
            description: description || "Group Chat",
            profilePic: imageUrl
        });

        const populatedGroup = await Group.findById(newGroup._id).populate("members", "-password");

        res.json({ success: true, group: populatedGroup, message: "Group created successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

// Get all groups that the logged in user is a member of
export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId }).populate("members", "-password");
        res.json({ success: true, groups });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};
