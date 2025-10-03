import { Router } from "express";
import { login, logoutUser, resgisterUser } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator,userLoginValidator  } from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(userRegistrationValidator(),validate, resgisterUser)
router.route("/login").post(userLoginValidator(), validate ,login)

//secure routes
router.route("/logout").post(verifyJWT, logoutUser)


export default router