import express from "express";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import jwt from "jsonwebtoken";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();


//generate jwt token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
};


//register route
router.post("/register", async (req, res) => {

    try {

        const {
            email,
            phone,
            organization,
            password,
            profilePicture
        } = req.body;


        //check required fields
        if (!email || !phone || !organization || !password) {
            return res.status(400).json({
                message: "Email, phone, organization, and password are required"
            });
        }


        //same password rule as User model
        if (password.length < 9) {
            return res.status(400).json({
                message: "Password must be at least 9 characters long"
            });
        }


        //check if email already exists
        const existingEmail = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingEmail) {
            return res.status(400).json({
                message: "An account with this email already exists"
            });
        }


        //check if phone already exists
        const existingPhone = await User.findOne({ phone });

        if (existingPhone) {
            return res.status(400).json({
                message: "An account with this phone number already exists"
            });
        }


        //find the organization entered by the user
        const foundOrganization = await Organization.findOne({
            name: organization.trim().toLowerCase()
        });


        if (!foundOrganization) {
            return res.status(404).json({
                message: "Organization not found"
            });
        }


        //create the user
        const userData = {
            email: email.trim().toLowerCase(),
            phone,
            organization: foundOrganization._id,
            passwordHash: password
        };


        //only include profilePicture if one was provided
        if (profilePicture) {
            userData.profilePicture = profilePicture;
        }


        const user = await User.create(userData);

        const token = generateToken(user._id);


        return res.status(201).json({
            message: "Account created successfully",

            token,

            user: {
                _id: user._id,
                email: user.email,
                phone: user.phone,
                organization: {
                    _id: foundOrganization._id,
                    name: foundOrganization.name
                }
            }
        });

    }

    catch (error) {

        console.log("Registration error:", error);

        return res.status(500).json({
            message: "Failed to create account",
            error: error.message
        });
    }
});


//login route
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }


        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).populate("organization", "name description active");


        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        const passwordMatches = await user.comparePassword(password);


        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }


        const token = generateToken(user._id);


        return res.status(200).json({
            message: "Login successful",

            token,

            user: {
                _id: user._id,
                email: user.email,
                phone: user.phone,
                profilePicture: user.profilePicture,
                organization: user.organization
            }
        });

    }

    catch (error) {

        console.log("Login error:", error);

        return res.status(500).json({
            message: "Failed to login",
            error: error.message
        });
    }
});


//get current logged in user
router.get("/me", protectRoute, async (req, res) => {

    return res.status(200).json({
        user: req.user
    });
});


export default router;