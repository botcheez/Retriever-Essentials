import express from "express";
import "dotenv/config";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import organizationRoutes from "./routes/organizationRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";

import { connectDB } from "./lib/db.js";

//the express.js main app
const app = express();
const PORT = process.env.PORT || 5000;

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

//start the server and connect to mongoDB
const startServer = async () => {
    try {

        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    }

    catch (error) {

        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();