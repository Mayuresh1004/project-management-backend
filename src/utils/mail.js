import { text } from "express";
import Mailgen from "mailgen";
import nodemailer from 'nodemailer'
import 'dotenv/config'


const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https:taskmanagerlink.com"
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent)
    const emailHtml = mailGenerator.generate(options.mailgenContent)


    // Looking to send emails in production? Check out our Email API/SMTP product!
    const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: MAILTRAP_SMTP_PORT,
    auth: {
        user: MAILTRAP_SMTP_USER,
        pass: MAILTRAP_SMTP_PASS
    }
    });

    const mail = {
        from: "taskmanager@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("Email service failed silently. Verify your credentials")
        console.error("Error: ",error)
    }

}

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
    forgotPasswordMailgenContent,
    sendEmail
}