import { User } from "../models/user.models";
import { ApiError } from "../utils/api-errors";
import { ApiResponse } from "../utils/api-response";
import { asyncHander } from "../utils/async-handler";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user =  await User.findById(userId)

        const accessToken = user.generateAcessToken()
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
        $or: [{username,email}]
    })

    if (UserExist) {
        throw new ApiError(409,"User with email or username already exists",[]);
        
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified
    })

    const {unhashedToken, hashedToken, tokenExpiry} = user.generateTemporaryToken()

    user.emailVerificationToken = hashedToken
    user.emailVerificationTokenExpiry = tokenExpiry

    await user.save({validateBeforeSave:false})

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgencontent: emailVerificationMailgenContent(user.username, `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unhashedToken}`)
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
                {user: createdUser},
                "User registered successfully and verification email has been sent on your email"
            )
        )

})


export {
    resgisterUser
}
