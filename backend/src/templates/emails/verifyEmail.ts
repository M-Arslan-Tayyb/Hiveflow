import config from "@/config/env.js";

interface VerifyEmailParams {
  fullName: string;
  verifyUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

const verifyEmailTemplate = ({
  fullName,
  verifyUrl,
}: VerifyEmailParams): EmailTemplate => {
  return {
    subject: "Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${config.appUrl}/public/images/logo.png" alt="Logo" style="height: 40px;" />
        </div>
        <h2>Hi ${fullName},</h2>
        <p>Please verify your email address.</p>
        <a href="${verifyUrl}"
          style="
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin: 16px 0;
          ">
          Verify Email
        </a>
        <p>This link will expire in <strong>24 hours</strong>.</p>
        <p>If you didn't create an account, ignore this email.</p>
        <hr/>
        <p style="color: #6B7280; font-size: 12px;">
          Project Management API
        </p>
      </div>
    `,
  };
};

export default verifyEmailTemplate;
