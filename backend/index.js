import express from "express";
import "dotenv/config";
import cors from "cors";

//route imports from the routes folder mount here
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import dataRoutes from "./routes/dataRoutes";

//connect the database import
import { connectDB } from "./lib/db";

//the express.js main app
const app = express();
const PORT = process.env.PORT || 3000;

//access the values and stuff in authroutes
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log("Incoming request: ", req.method, req.url); 
    next();
});

//route roots (like the initial api call of the route which branches from there depending on the request)
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/data', dataRoutes);
