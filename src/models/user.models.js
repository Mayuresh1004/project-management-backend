import mongoose from "mongoose";
import bycrpt from 'bcrypt'

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

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next()
    }
    this.password = await bycrpt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return bycrpt.compare(password,this.password)
}


export const  User = mongoose.model("User",userSchema)
