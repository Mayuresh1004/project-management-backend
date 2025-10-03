import { User } from "../models/user.models";
import { ApiError } from "../utils/api-errors";
import { ApiResponse } from "../utils/api-response";
import { asyncHander } from "../utils/async-handler";
import jwt from 'jsonwebtoken'

export const verifyJWT = asyncHander( async (requestAnimationFrame,resizeBy,next) => {
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