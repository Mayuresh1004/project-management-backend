import { ApiResponse } from "../utils/api-response.js";
import { asyncHander } from "../utils/async-handler.js";

// const healthCheck = (req,res, next) => {
//     try {
//         res.status(200).json(
//             new ApiResponse(200,{message:"Server is Running"})
//         )
//     } catch (error) {
//         next(error)
//     }
// }


const healthCheck = asyncHander(async (req,res)=>{
    res.status(200).json(
             new ApiResponse(200,{message:"Server is Running"})
         )
})


export { healthCheck }