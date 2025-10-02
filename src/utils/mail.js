import { text } from "express";
import Mailgen from "mailgen";

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "We are excited to have you onboard!",
            action: {
                instructions: "To verify your email please click on the following button.",
                button: {
                    color: "#1aae5aff",
                    text: "Verify your email",
                    link: verificationUrl
                }
            },
            outro: "Need help or have questions? Just reply to this email, we'd love to help."
        }
    }
}


const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of your account.",
            action: {
                instructions: "To reset your password please click on the following button.",
                button: {
                    color: "#22BC66",
                    text: "Rest Password",
                    link: passwordResetUrl
                }
            },
            outro: "Need help or have questions? Just reply to this email, we'd love to help."
        }
    }
}

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent
}