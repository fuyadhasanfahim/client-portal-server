import nodemailer from "nodemailer";
import envConfig from "../config/env.config";

interface EmailOptions {
    from?: string;
    to: string;
    subject: string;
    html: string;
}

const { email_user, email_password } = envConfig;

export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: email_user!,
        pass: email_password!,
    },
});

export const sendEmail = async ({ to, subject, html, from }: EmailOptions) => {
    await transporter.sendMail({
        from: from ? from : email_user,
        to,
        subject,
        html,
    });
};
