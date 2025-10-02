import mongoose from "mongoose";
import bycrpt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import crypto from 'crypto'

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

userShema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
)
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
        username: this.username
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
)
}

userSchema.methods.generateTemporaryToken = function (){
    const unhashedToken = crypto.randomBytes(20).toString("hex")

    const hashedToken = crypto.createHash("sha256").update(unhashedToken).digest("Hex")

    const tokenExpiry = Date.now() + (20*60*1000) //20 mins

    return {unhashedToken, hashedToken, tokenExpiry}

}


export const  User = mongoose.model("User",userSchema)
