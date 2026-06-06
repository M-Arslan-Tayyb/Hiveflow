import config from "../../config/env.js";
const resetPasswordTemplate = ({ fullName, resetUrl, }) => {
    return {
        subject: "Password Reset Request",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${config.appUrl}/public/images/logo.png" alt="Logo" style="height: 40px;" />
        </div>
        <h2>Hi ${fullName},</h2>
        <p>We received a request to reset your password.</p>
        <a href="${resetUrl}"
          style="
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin: 16px 0;
          ">
          Reset Password
        </a>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
        <hr/>
        <p style="color: #6B7280; font-size: 12px;">
          Project Management API
        </p>
      </div>
    `,
    };
};
export default resetPasswordTemplate;
//# sourceMappingURL=resetPassword.js.map