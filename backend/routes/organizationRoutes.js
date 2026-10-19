import express, { json } from "express";
import Organization from "../models/Organization";
import protectRoute from "../middleware/auth.middleware";

const router = express.Router();

//get the organization id
router.get("/:id", protectRoute, async(req, res) => {
    try {
        const org = await Organization.findById(req.params.id).select(" _id name description active ");
        if(!org) return res.status(400).json({message: "Organization not found"});

        res.status(200).json(org);
    } 
    
    catch (error) {
        res.status(500).json({message: "Failed to fetch the organization"});
    }
});

export default router;