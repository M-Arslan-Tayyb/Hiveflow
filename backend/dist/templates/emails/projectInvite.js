import config from "../../config/env.js";
const projectInviteTemplate = ({ fullName, projectName, role, magicLinkUrl, generatedPassword, }) => {
    const passwordSection = generatedPassword
        ? `<div style="background-color: #F3F4F6; border-radius: 4px; padding: 16px; margin: 16px 0;">
             <p style="margin: 0; font-size: 14px; color: #374151;">Your temporary password:</p>
             <p style="margin: 8px 0 0; font-size: 18px; font-weight: bold; font-family: monospace; color: #1F2937;">${generatedPassword}</p>
             <p style="margin: 8px 0 0; font-size: 12px; color: #6B7280;">Please change this after your first login.</p>
           </div>`
        : "";
    return {
        subject: `You've been invited to join ${projectName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${config.appUrl}/public/images/logo.png" alt="Logo" style="height: 40px;" />
        </div>
        <h2>Welcome, ${fullName}!</h2>
        <p>You have been invited to join the project <strong>${projectName}</strong> as a <strong>${role}</strong>.</p>
        ${passwordSection}
        <a href="${magicLinkUrl}"
          style="
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin: 16px 0;
          ">
          Join Project
        </a>
        <p>This link will expire in <strong>7 days</strong>.</p>
        <p>If you didn't expect this invite, you can safely ignore this email.</p>
        <hr/>
        <p style="color: #6B7280; font-size: 12px;">Project Management API</p>
      </div>
    `,
    };
};
export default projectInviteTemplate;
//# sourceMappingURL=projectInvite.js.map