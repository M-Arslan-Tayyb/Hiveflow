import type { ProjectRole } from "@prisma/client";
import { sendEmail } from "@/config/mailer.js";
import resetPasswordTemplate from "@/templates/emails/resetPassword.js";
import verifyEmailTemplate from "@/templates/emails/verifyEmail.js";
import orgInviteTemplate from "@/templates/emails/orgInvite.js";
import orgRemovalTemplate from "@/templates/emails/orgRemoval.js";
import projectInviteTemplate from "@/templates/emails/projectInvite.js";

interface ResetPasswordEmailArgs {
  to: string;
  fullName: string;
  resetUrl: string;
}

interface VerifyEmailArgs {
  to: string;
  fullName: string;
  verifyUrl: string;
}

interface OrgInviteEmailArgs {
  to: string;
  orgName: string;
  inviteUrl: string;
}

interface OrgRemovalEmailArgs {
  to: string;
  fullName: string;
  orgName: string;
}

interface ProjectInviteEmailArgs {
  to: string;
  fullName: string;
  projectName: string;
  role: ProjectRole;
  magicLinkUrl: string;
  generatedPassword?: string | null;
}

export const sendResetPasswordEmail = async ({
  to,
  fullName,
  resetUrl,
}: ResetPasswordEmailArgs): Promise<void> => {
  const template = resetPasswordTemplate({ fullName, resetUrl });
  await sendEmail({ to, subject: template.subject, html: template.html });
};

export const sendVerifyEmail = async ({
  to,
  fullName,
  verifyUrl,
}: VerifyEmailArgs): Promise<void> => {
  const template = verifyEmailTemplate({ fullName, verifyUrl });
  await sendEmail({ to, subject: template.subject, html: template.html });
};

export const sendOrgInviteEmail = async ({
  to,
  orgName,
  inviteUrl,
}: OrgInviteEmailArgs): Promise<void> => {
  const template = orgInviteTemplate({ orgName, inviteUrl });
  await sendEmail({ to, subject: template.subject, html: template.html });
};

export const sendOrgRemovalEmail = async ({
  to,
  fullName,
  orgName,
}: OrgRemovalEmailArgs): Promise<void> => {
  const template = orgRemovalTemplate({ fullName, orgName });
  await sendEmail({ to, subject: template.subject, html: template.html });
};

export const sendProjectInviteEmail = async ({
  to,
  fullName,
  projectName,
  role,
  magicLinkUrl,
  generatedPassword,
}: ProjectInviteEmailArgs): Promise<void> => {
  const template = projectInviteTemplate({
    fullName,
    projectName,
    role,
    magicLinkUrl,
    generatedPassword,
  });
  await sendEmail({ to, subject: template.subject, html: template.html });
};
