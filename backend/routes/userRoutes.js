import User from "../models/User.js";
import express, { json } from "express";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

//get user by their id
router.get("/:id", protectRoute, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(" _id organizationName email phone profilePicture");
        if(!user) return res.status(400).json({message: "User not found"});

        //returns the user info that we fetched in the success response for the frontend
        res.status(200).json(user);
    } 
    
    catch (error) {
        res.status(500).json({ mesage: "Failed to fetch user"});
    }
});

export default router;