import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema({

    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    fileName: {
        type: String,
        required: true,
        trim: true
    },

    fileType: {
        type: String,
        required: true
    },

    fileSize: {
        type: Number,
        required: true
    },

    recordsUploaded: {
        type: Number,
        required: true,
        default: 0
    }

}, {
    timestamps: true
});

export default mongoose.model("Upload", uploadSchema);