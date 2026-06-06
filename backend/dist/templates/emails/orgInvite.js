import config from "../../config/env.js";
const orgInviteTemplate = ({ orgName, inviteUrl, }) => {
    return {
        subject: `You are invited to join ${orgName}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${config.appUrl}/public/images/logo.png" alt="Logo" style="height: 40px;" />
        </div>
        <h2>You have been invited!</h2>
        <p>You have been invited to join <strong>${orgName}</strong>.</p>
        <a href="${inviteUrl}"
          style="
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin: 16px 0;
          ">
          Accept Invite
        </a>
        <p>This link will expire in <strong>24 hours</strong>.</p>
        <p>If you didn't expect this, ignore this email.</p>
        <hr/>
        <p style="color: #6B7280; font-size: 12px;">
          Project Management API
        </p>
      </div>
    `,
    };
};
export default orgInviteTemplate;
//# sourceMappingURL=orgInvite.js.map