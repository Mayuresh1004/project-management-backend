import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-errors.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHander } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail } from "../utils/mail.js";
import jwt from 'jsonwebtoken'
import crypto from 'crypto'


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

const getCurrentUser = asyncHander( async (req,res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        )
})

const verifyEmail = asyncHander( async (req,res) => {
    const {verificationToken} = req.params

    if (!verificationToken) {
        throw new ApiError(400,"Email verification token is missing");
        
    }

    let hashedToken = crypto.createHash("sha256").update(verificationToken).digest("hex")
    

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationTokenExpiry: {$gt: Date.now()}
    })

    if (!user) {

        throw new ApiError(400,"Token is invalid or expired");

    }

    user.emailVerificationToken = undefined
    user.emailVerificationTokenExpiry = undefined

    user.isEmailVerified = true

    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isEmailVerified: true
                },
                "Email is verified"
            )
        )

})

const resendEmailVerification = asyncHander( async (req,res) => {

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404,"User does not exists");
        
    }

    if (user.isEmailVerified) {
        throw new ApiError(409,"Email is already verified");
        
    }

const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationTokenExpiry = tokenExpiry

    await user.save({validateBeforeSave:false})

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailgenContent(user.username, `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`)
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Mail has been sent to ur email id"
            )
        )


})


const refreshAccessToken = asyncHander( async (req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {

        throw new ApiError(401,"Unauthorized access");
        
    }
    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedRefreshToken?._id)

        if (!user) {
            throw new ApiError(402,"Invalid Refresh Token");
            
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            
            throw new ApiError(402,"Refresh Token is Expired");

        }

        const options = {
            httpOnly: true,
            secure:true
        }

        const {accessToken,refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        user.refreshToken = newRefreshToken

        await user.save()

        return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",newRefreshToken,options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken:newRefreshToken
                    },
                    "Access Token refreshed "
                )
            )


    } catch (error) {
        throw new ApiError(401,"Invalid Refresh Token");
        
    }

})


const forgotPasswordRequest = asyncHander( async (req,res) => {

    const {email} = req.body

    const user = await User.findOne({email})

    if (!user) {
        throw new ApiError(404, "User does not exist", []);
        
    }

    const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.forgotPasswordToken = hashedToken
    user.forgotPasswordTokenExpiry = tokenExpiry

    await user.save({validateBeforeSave: false})


    await sendEmail({
        email: user?.email,
        subject: "Password reser request",
        mailgenContent: forgotPasswordMailgenContent(user.username, `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unhashedToken}`)
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent to your mail id"
            )
        )

    })

const resetForgotPassword = asyncHander( async (req,res) => {
    const {resetToken} = req.params
    const {newPassword} = req.body

    let hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordTokenExpiry: {$gt: Date.now()}
    })

    if (!user) {
        throw new ApiError(405,"Token is invalid or Expired");
        
    }

    user.forgotPasswordTokenExpiry = undefined
    user.forgotPasswordToken = undefined

    user.password = newPassword

    await user.save({validateBeforeSave: false})
    
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset successfully"
            )
        )

})

const changeCurrentPassword = asyncHander( async (req,res) => {
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(400,"Invalid Old Password");
        
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )

})


export {
    resgisterUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword 
}


