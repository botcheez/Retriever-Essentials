import mongoose, {mongo, Mongoose} from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    // organizationName: {
    //     type: String,
    //     required: true,
    //     unique: true,
    //     trim: true,
    // },

    //email of the person logged in
    email: {
        type: String,
        required: true,
        unique: true,
        trime: true,
        lowercase: true,
    },

    //the hashed password ofthe user (it will be salted/hashed so we are savig the hashed version not the raw one)
    passwordHash: {
        type: String,
        required: true,
        minLength: 9,
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    profilePicture: {
        type: String,
        unique: true,
    },

    //this references the organization the user belongs to
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
    }
}, {timestamps: true});

//password hashing
userSchema.pre('save', async function (next) {

    //if the password is not being updated we don't want to has it again
    if(!this.isModified("passwordHash")) return next();

    const salt = await bcrypt.genSalt(10);

    //hash the password field before saving it
    //salts the password to protect user data
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    
});

userSchema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.passwordHash);

};

const User = mongoose.model('User', userSchema);

export default User;