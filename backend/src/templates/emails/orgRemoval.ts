interface OrgRemovalParams {
  fullName: string;
  orgName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

const orgRemovalTemplate = ({
  fullName,
  orgName,
}: OrgRemovalParams): EmailTemplate => {
  return {
    subject: `You have been removed from ${orgName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Membership Removed</h2>
        <p>Hi <strong>${fullName}</strong>,</p>
        <p>You have been removed from the organization <strong>${orgName}</strong>.</p>
        <p>You can still log in to your account, but you will no longer have access to this organization.</p>
        <p>If you believe this was a mistake, please contact your organization owner.</p>
        <hr/>
        <p style="color: #6B7280; font-size: 12px;">
          Project Management API
        </p>
      </div>
    `,
  };
};

export default orgRemovalTemplate;
