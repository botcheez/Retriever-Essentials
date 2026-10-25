import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

const generateToken = (userId) => {
    //user id is needed to represent who the user is
    return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn:"30d"});
}

//register route
router.post("/register", async (req, res) => {
    try {
        
    } 
    
    catch (error) {
        
    }
})

//login route