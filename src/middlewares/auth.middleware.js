import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-errors.js";
import { asyncHander } from "../utils/async-handler.js";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHander( async (req,res,next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")


    if (!token) {
        throw new ApiError(401,"Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry"
    )
        if (!user) {
            throw new ApiError(401,"Invalid Access Token");
            
        }

        req.user = user
        next()


    } catch (error) {
                
        throw new ApiError(401,"Invalid Access Token");

    }

} )