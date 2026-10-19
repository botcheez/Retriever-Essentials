import mongoose, {mongo, Mongoose} from "mongoose";

const dataSchema = new mongoose.Schema({
    fileType: {
        type: String,
        required: true,
    },

    uploadedBy: {

    },
});

const Data = mongoose.model("Data", dataSchema);

export default Data;
