import nodemailer from "nodemailer";
import config from "../config/env.js";
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: Number(config.smtp.port),
    secure: false,
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
    },
    tls: {
        rejectUnauthorized: false,
    },
});
export const sendEmail = async ({ to, subject, html, }) => {
    await transporter.sendMail({
        from: `"${config.appName}" <${config.smtp.user}>`,
        to,
        subject,
        html,
    });
};
//# sourceMappingURL=mailer.js.map