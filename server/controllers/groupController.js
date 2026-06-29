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

// Update group details 
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, profilePic } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.json({ success: false, message: "Group not found" });
        }

        // Only group members can update it
        if (!group.members.includes(userId.toString())) {
            return res.json({ success: false, message: "Unauthorized to update this group" });
        }

        const updates = {};
        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updates.profilePic = uploadResponse.secure_url;
        }

        const updatedGroup = await Group.findByIdAndUpdate(groupId, updates, { new: true }).populate("members", "-password");

        res.json({ success: true, group: updatedGroup, message: "Group updated successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

