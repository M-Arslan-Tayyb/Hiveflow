import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../../../config/db.js";
import config from "../../../config/env.js";
import ApiError from "../../../utils/ApiError.js";
import { sendProjectInviteEmail } from "../../../templates/emailService.js";
const addMember = async ({ projectId, orgId, userId, role }) => {
    // User exists?
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    // Project exists in this org?
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
    });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    // Already a project member?
    const existingProjectMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId, projectId } },
    });
    if (existingProjectMember) {
        throw new ApiError(409, "User is already a project member");
    }
    await prisma.$transaction(async (tx) => {
        await tx.projectMember.create({
            data: { userId, projectId, role },
        });
        // If not already an org member, add as MEMBER
        const existingOrgMember = await tx.orgMember.findUnique({
            where: { userId_orgId: { userId, orgId } },
        });
        if (!existingOrgMember) {
            await tx.orgMember.create({
                data: { userId, orgId, role: "MEMBER" },
            });
        }
    });
    return true;
};
const removeMember = async ({ projectId, orgId, targetUserId, requestingUserId, }) => {
    // Project exists in this org?
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
    });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    const targetMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: targetUserId, projectId } },
    });
    if (!targetMember) {
        throw new ApiError(404, "Member not found in this project");
    }
    // Cannot remove yourself if you are the only MANAGER
    if (targetUserId === requestingUserId && targetMember.role === "MANAGER") {
        const managerCount = await prisma.projectMember.count({
            where: { projectId, role: "MANAGER" },
        });
        if (managerCount === 1) {
            throw new ApiError(403, "Cannot remove yourself as the only project manager");
        }
    }
    await prisma.projectMember.delete({
        where: { userId_projectId: { userId: targetUserId, projectId } },
    });
    return true;
};
const updateMemberRole = async ({ projectId, orgId, targetUserId, role, }) => {
    // Project exists in this org?
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId },
    });
    if (!project) {
        throw new ApiError(404, "Project not found");
    }
    const targetMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: targetUserId, projectId } },
    });
    if (!targetMember) {
        throw new ApiError(404, "Member not found in this project");
    }
    const updated = await prisma.projectMember.update({
        where: { userId_projectId: { userId: targetUserId, projectId } },
        data: { role },
    });
    return updated;
};
const inviteProjectMember = async ({ projectId, orgId, email, fullName, role, invitedById, }) => {
    // 1. Project exists in this org?
    const project = await prisma.project.findFirst({
        where: { id: projectId, orgId, isArchived: false },
    });
    if (!project)
        throw new ApiError(404, "Project not found");
    // 2. Find or create user
    let user = await prisma.user.findUnique({ where: { email } });
    let generatedPassword = null;
    if (!user) {
        if (!fullName)
            throw new ApiError(400, "fullName is required when inviting a new user");
        generatedPassword = crypto.randomBytes(5).toString("hex");
        const hashedPassword = await bcrypt.hash(generatedPassword, 12);
        user = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword,
                isVerified: true,
                isActive: true,
            },
        });
    }
    // 3. Already a project member?
    const existingMember = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: user.id, projectId } },
    });
    if (existingMember)
        throw new ApiError(409, "User is already a project member");
    // 3b. Already has a pending (unused, non-expired) invite?
    const existingInvite = await prisma.projectInvite.findFirst({
        where: {
            email,
            projectId,
            isUsed: false,
            expiry: { gt: new Date() },
        },
    });
    if (existingInvite)
        throw new ApiError(409, "User already has a pending invite for this project. The invite expires in 7 days.");
    // 4. Generate tokens
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const rawMagicToken = crypto.randomBytes(32).toString("hex");
    const hashedMagicToken = crypto
        .createHash("sha256")
        .update(rawMagicToken)
        .digest("hex");
    const sevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // 5. Save ProjectInvite + magicLinkToken on User in one transaction
    await prisma.$transaction(async (tx) => {
        await tx.projectInvite.create({
            data: {
                email,
                token: inviteToken,
                role,
                expiry: sevenDays,
                projectId,
                invitedById,
            },
        });
        await tx.user.update({
            where: { id: user.id },
            data: {
                magicLinkToken: hashedMagicToken,
                magicLinkExpiry: sevenDays,
            },
        });
    });
    // 6. Send invite email
    const magicLinkUrl = `${config.frontendUrl}/auth/magic-link?token=${rawMagicToken}`;
    await sendProjectInviteEmail({
        to: email,
        fullName: user.fullName,
        projectName: project.name,
        role,
        magicLinkUrl,
        generatedPassword,
    });
    return true;
};
export { addMember, removeMember, updateMemberRole, inviteProjectMember };
//# sourceMappingURL=members.service.js.map