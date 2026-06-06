import { sendEmail } from "../config/mailer.js";
import resetPasswordTemplate from "../templates/emails/resetPassword.js";
import verifyEmailTemplate from "../templates/emails/verifyEmail.js";
import orgInviteTemplate from "../templates/emails/orgInvite.js";
import orgRemovalTemplate from "../templates/emails/orgRemoval.js";
import projectInviteTemplate from "../templates/emails/projectInvite.js";
export const sendResetPasswordEmail = async ({ to, fullName, resetUrl, }) => {
    const template = resetPasswordTemplate({ fullName, resetUrl });
    await sendEmail({ to, subject: template.subject, html: template.html });
};
export const sendVerifyEmail = async ({ to, fullName, verifyUrl, }) => {
    const template = verifyEmailTemplate({ fullName, verifyUrl });
    await sendEmail({ to, subject: template.subject, html: template.html });
};
export const sendOrgInviteEmail = async ({ to, orgName, inviteUrl, }) => {
    const template = orgInviteTemplate({ orgName, inviteUrl });
    await sendEmail({ to, subject: template.subject, html: template.html });
};
export const sendOrgRemovalEmail = async ({ to, fullName, orgName, }) => {
    const template = orgRemovalTemplate({ fullName, orgName });
    await sendEmail({ to, subject: template.subject, html: template.html });
};
export const sendProjectInviteEmail = async ({ to, fullName, projectName, role, magicLinkUrl, generatedPassword, }) => {
    const template = projectInviteTemplate({
        fullName,
        projectName,
        role,
        magicLinkUrl,
        generatedPassword,
    });
    await sendEmail({ to, subject: template.subject, html: template.html });
};
//# sourceMappingURL=emailService.js.map