import { Router } from "express";
import { resgisterUser } from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator } from "../validators/index.js";


const router = Router()

router.route("/register").post(userRegistrationValidator(),validate, resgisterUser)


export default router