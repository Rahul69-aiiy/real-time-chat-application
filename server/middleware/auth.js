import User from "../models/User.js";
import jwt from "jsonwebtoken";

// middleware to protect routes
export const protectRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.json({
        success: false,
        message: "Unauthorized - no token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Exclude password for safety
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
