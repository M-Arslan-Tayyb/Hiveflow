import crypto from "crypto";
import prisma from "../../config/db.js";
import config from "../../config/env.js";
import { sendOrgInviteEmail, sendOrgRemovalEmail, } from "../../templates/emailService.js";
import ApiError from "../../utils/ApiError.js";
const createOrg = async ({ name, slug, userId }) => {
    // 1. Slug unique check
    const existingOrg = await prisma.organization.findUnique({
        where: { slug },
    });
    if (existingOrg) {
        throw new ApiError(409, "Organization name/slug already taken");
    }
    // 2. Create org + OWNER member — in one transaction
    const org = await prisma.$transaction(async (tx) => {
        const newOrg = await tx.organization.create({
            data: { name, slug },
        });
        await tx.orgMember.create({
            data: {
                userId,
                orgId: newOrg.id,
                role: "OWNER",
            },
        });
        return newOrg;
    });
    return org;
};
const getOrg = async ({ orgId, userId }) => {
    // Member?
    const orgMember = await prisma.orgMember.findUnique({
        where: {
            userId_orgId: {
                userId,
                orgId,
            },
        },
    });
    if (!orgMember) {
        throw new ApiError(403, "You are not a member of this organization");
    }
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            avatar: true,
                        },
                    },
                },
            },
        },
    });
    if (!org) {
        throw new ApiError(404, "Organization not found");
    }
    return org;
};
const updateOrg = async ({ orgId, name }) => {
    // 1. Member check handled by loadOrgMember middleware
    // 2. Update
    const org = await prisma.organization.update({
        where: { id: orgId },
        data: { name },
    });
    return org;
};
const deleteOrg = async ({ orgId }) => {
    await prisma.organization.update({
        where: { id: orgId },
        data: { isActive: false },
    });
    return true;
};
const getAllOrgs = async ({ userId }) => {
    const orgs = await prisma.organization.findMany({
        where: {
            isActive: true,
            members: {
                some: {
                    userId,
                },
            },
        },
        include: {
            members: {
                where: { userId },
                select: {
                    role: true,
                },
            },
        },
    });
    return orgs;
};
const inviteMember = async ({ orgId, email, invitedById, }) => {
    // 1. Org exists?
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
    });
    if (!org) {
        throw new ApiError(404, "Organization not found");
    }
    // 2. Already a member?
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        const existingMember = await prisma.orgMember.findUnique({
            where: {
                userId_orgId: {
                    userId: existingUser.id,
                    orgId,
                },
            },
        });
        if (existingMember) {
            throw new ApiError(409, "User is already a member");
        }
    }
    // 3. Pending invite?
    const existingInvite = await prisma.orgInvite.findFirst({
        where: {
            email,
            orgId,
            isUsed: false,
            expiry: { gt: new Date() },
        },
    });
    if (existingInvite) {
        throw new ApiError(409, "Invite already sent to this email");
    }
    // 4. Build token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    // 5. Save OrgInvite
    await prisma.orgInvite.create({
        data: {
            email,
            token: inviteToken,
            expiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
            orgId,
            invitedById,
        },
    });
    // 6. Send email
    const inviteUrl = `${config.frontendUrl}/register?inviteToken=${inviteToken}`;
    await sendOrgInviteEmail({
        to: email,
        orgName: org.name,
        inviteUrl,
    });
    return true;
};
const removeMember = async ({ orgId, targetUserId, requestingUserId, }) => {
    // 1. Member exists? — fetch user + org too for the email
    const targetMember = await prisma.orgMember.findUnique({
        where: {
            userId_orgId: {
                userId: targetUserId,
                orgId,
            },
        },
        include: {
            user: {
                select: { fullName: true, email: true },
            },
            org: {
                select: { name: true },
            },
        },
    });
    if (!targetMember) {
        throw new ApiError(404, "Member not found");
    }
    // 2. Cannot remove the OWNER
    if (targetMember.role === "OWNER") {
        throw new ApiError(403, "Cannot remove the organization owner");
    }
    // 3. Cannot remove yourself
    if (targetUserId === requestingUserId) {
        throw new ApiError(403, "Cannot remove yourself from the organization");
    }
    // 4. Delete
    await prisma.orgMember.delete({
        where: {
            userId_orgId: {
                userId: targetUserId,
                orgId,
            },
        },
    });
    // 5. Send removal email
    await sendOrgRemovalEmail({
        to: targetMember.user.email,
        fullName: targetMember.user.fullName,
        orgName: targetMember.org.name,
    });
    return true;
};
const getOrgMembers = async ({ orgId, userId }) => {
    // 1. Requesting user a member?
    const requestingMember = await prisma.orgMember.findUnique({
        where: {
            userId_orgId: {
                userId,
                orgId,
            },
        },
    });
    if (!requestingMember) {
        throw new ApiError(403, "You are not a member of this organization");
    }
    // 2. Fetch all members
    const members = await prisma.orgMember.findMany({
        where: { orgId },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                },
            },
        },
    });
    return members;
};
export { createOrg, getOrg, updateOrg, deleteOrg, getAllOrgs, inviteMember, removeMember, getOrgMembers, };
//# sourceMappingURL=org.service.js.map