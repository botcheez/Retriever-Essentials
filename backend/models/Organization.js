import mongoose, {mongo, Mongoose} from "mongoose";

const organizationSchema = new mongoose.Schema({

    //org name
    name: {
        type: String,
        require: true,
        unique: true,
        trim: true,
        lowercase: true,
    },

    //description of the org (like what they do and stuff)
    description: {
        type: String,
        default: true,
    },

    //is this organization active or dormant/shutdown ettc
    active: {
        type: Boolean,
        default: true,
    },


}, {timestamps: true},);

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;