import { body } from "express-validator";

const userRegistrationValidator = () => {
    return [
        body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid"),
        body("username").trim().notEmpty().withMessage("Username is reqiured").isLength({min: 3}).withMessage("Username must be atleast 3 characters"),
        body("password").trim().notEmpty().withMessage("Password is required"),
        body("fullName").optional().trim()
    ]
}

const userLoginValidator = () => {
    return [
            
        body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Email is invalid"),
        body("password").trim().notEmpty().withMessage("Password is required"),

    ]
}




export { userRegistrationValidator , userLoginValidator }