import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Database Has Connected ${conn.connection.host}`);
    } 
    
    catch (error) {
        console.log("Error connecting to database", error);

        //exit the database with a failure
        process.exit(1);
    }
}