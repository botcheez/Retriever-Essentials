import mongoose, {mongo, Mongoose} from "mongoose";
import Organization from "./Organization";

const dataSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    fileName: {
        type: String,
        required: true,
        trim: true,
    },

    fileType: {
        type: String,
        required: true,
        enum: ["csv", "xlsx"],
    },

    //term & year that the activity or code is happening
    term_code: {
        type: String,
        required: true,
        trim: true,
    },

    activity_date: {
        type: Date,
        required: true,
    },

    unit_code: {
        type: String,
        required: true,
        trim: true,
    },

    activity_type: {
        type: String,
        required: true,
        trim: true,
    },

    event_name: {
        type: String,
        required: true,
        trim: true,
    },

    quantity: {
        type: Number,
        default: 0,
        min: 0,
    },

    //student academic level
    level: {
        type: String,
        trim: true,
    },

    //student class standing
    class_standing: {
        type: String,
        trim: true,
    },

    enrollment_status: {
        type: String,
        trim: true,
    },

    race: {
        type: String,
        trim: true,
    },

    gender: {
        type: String,
        trim: true,
    },

    pell_eligible: {
        type: Boolean,
        default: false,
    },

    //is this a first generation student
    first_gen: {
        type: Boolean,
        default: false,
    },

    //is this a transfer student
    transfer_student: {
        type: Boolean,
        default: false,
    },

    //housing status of the student
    housing: {
        type: String,
        trim: true,
    },

    //college the student is attending
    college: {
        type: String,
        trim: true,
    },
}, {timestamps: true},);

const Data = mongoose.model("Data", dataSchema);

export default Data;
