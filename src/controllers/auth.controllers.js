import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHander } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user =  await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating access token");
        
    }
}

const resgisterUser = asyncHander(async (req,res) => {
    const {email,password,username,role} = req.body

    const UserExist = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (UserExist) {
        throw new ApiError(409,"User with email or username already exists",[]);
        
    }

    const user = await User.create({
        email,
        password,
        username
    })

    const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationTokenExpiry = tokenExpiry

    await user.save({validateBeforeSave:false})

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(user.username, `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`)
    })

    const createdUser =await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    )

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while creating the user");
        
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                "User registered successfully and verification email has been sent on your email",
                { user: createdUser }
            )
        )

})

const login = asyncHander(async (req,res) => {
    const {email, password, username} = req.body

    if (!email) {
        throw new ApiError(400,"Email is required");
        
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400,"User does not exists");
        
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400,"Invalid credentials");
        
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedinUser =await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    )

    if (!loggedinUser) {
        throw new ApiError(500,"Something went wrong while creating the user");
        
    }

    const options = {
        httpOnly: true,
        secure: true
    }


    return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedinUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )

})

const logoutUser = asyncHander( async (req,res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $set: {
            refreshToken: ""
        }
    },
    {
        new: true
    },

);
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json(
            new ApiResponse(200,{},"User logged out")
        )

} )

export {
    resgisterUser,
    login,
    logoutUser
}


