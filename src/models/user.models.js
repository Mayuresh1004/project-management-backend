import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    avatar:{
        type:{
            url: String,
            localPath: String,
        },
        default:{
            url: `http://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg`,
            loacalPath: ""
        }
    },
    username:{
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        index: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    fullName: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String
    },
    forgotPasswordToken: {
        type: String
    },
    forgotPasswordTokenExpiry: {
        type: Date
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationTokenExpiry: {
        type: Date
    }
},{
    timestamps: true
}

)      

export const  User = mongoose.model("User",userSchema)
