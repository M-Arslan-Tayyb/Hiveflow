import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import config from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import { sendResetPasswordEmail, sendVerifyEmail, } from "../../templates/emailService.js";
const registerUser = async ({ fullName, email, password, inviteToken, }) => {
    // 1. Email check
    console.log("INVITE TOKEN RECEIVED:", inviteToken);
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new ApiError(409, "Email already exists");
    }
    // 2. Validate invite token — if provided
    if (inviteToken) {
        const validInvite = await prisma.orgInvite.findFirst({
            where: {
                token: inviteToken,
                email,
                isUsed: false,
                expiry: { gt: new Date() },
            },
        });
        if (!validInvite) {
            throw new ApiError(400, "Invalid or expired invite token");
        }
    }
    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // 4. Build verify token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const hashedVerifyToken = crypto
        .createHash("sha256")
        .update(verifyToken)
        .digest("hex");
    // 5. Create user
    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            password: hashedPassword,
            emailVerifyToken: hashedVerifyToken,
            emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
            inviteToken: inviteToken || null,
        },
    });
    // 6. Send verify email
    const verifyUrl = `${config.frontendUrl}/verify-email?token=${verifyToken}`;
    await sendVerifyEmail({ to: email, fullName, verifyUrl });
    const { password: _password, passwordResetToken: _prt, passwordResetExpiry: _pre, emailVerifyToken: _evt, emailVerifyExpiry: _eve, ...userWithoutSensitiveFields } = user;
    return userWithoutSensitiveFields;
};
const loginUser = async ({ email, password }) => {
    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw new ApiError(401, "Invalid credentials");
    }
    // 2. Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }
    // 3. Active check
    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }
    if (!user.isVerified) {
        throw new ApiError(403, "Please verify your email first");
    }
    // 4. Build tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
    const orgMembership = await prisma.orgMember.findFirst({
        where: { userId: user.id },
        select: {
            role: true,
        },
    });
    // 5. Strip sensitive fields
    const { password: _password, passwordResetToken: _prt, passwordResetExpiry: _pre, ...userWithoutSensitiveFields } = user;
    return {
        user: {
            ...userWithoutSensitiveFields,
            role: orgMembership?.role ?? (user.isOwner ? "OWNER" : null),
        },
        accessToken,
        refreshToken,
    };
};
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token not found");
    }
    // Verify
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    // User exists?
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
    });
    if (!user) {
        throw new ApiError(401, "Invalid refresh token");
    }
    if (!user.isActive) {
        throw new ApiError(403, "Account is deactivated");
    }
    // New access token
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
    return { accessToken };
};
const logoutUser = async (refreshToken) => {
    if (!refreshToken) {
        throw new ApiError(401, "Refresh token not found");
    }
    jwt.verify(refreshToken, config.jwt.refreshSecret);
    return true;
};
const forgotPassword = async (email) => {
    // 1. Find user
    const user = await prisma.user.findUnique({
        where: { email },
    });
    // Security — same message even if user not found
    if (!user) {
        return true;
    }
    // 2. Build token
    const resetToken = crypto.randomBytes(32).toString("hex");
    // 3. Hash token before storing
    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
    // 4. Save with 15 min expiry
    await prisma.user.update({
        where: { email },
        data: {
            passwordResetToken: hashedToken,
            passwordResetExpiry: new Date(Date.now() + 15 * 60 * 1000),
        },
    });
    // 5. Send email
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    await sendResetPasswordEmail({
        to: email,
        fullName: user.fullName,
        resetUrl,
    });
    return true;
};
const resetPassword = async ({ token, password }) => {
    // 1. Hash incoming token — stored hashed
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    // 2. Find user — token + expiry check
    const user = await prisma.user.findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpiry: {
                gt: new Date(),
            },
        },
    });
    if (!user) {
        throw new ApiError(400, "Invalid or expired reset token");
    }
    // 3. Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    // 4. Update password — clear token
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpiry: null,
        },
    });
    return true;
};
const registerOwner = async ({ fullName, email, password, inviteSecret, }) => {
    // 1. Secret check
    if (inviteSecret !== config.ownerInviteSecret) {
        throw new ApiError(403, "Invalid invite secret");
    }
    // 2. Email check
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw new ApiError(409, "Email already exists");
    }
    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    // 4. Create owner
    const user = await prisma.user.create({
        data: {
            fullName,
            email,
            password: hashedPassword,
            isOwner: true,
            isVerified: true,
        },
    });
    const { password: _password, passwordResetToken: _prt, passwordResetExpiry: _pre, emailVerifyToken: _evt, emailVerifyExpiry: _eve, inviteToken: _it, isOwner: _io, ...userWithoutSensitiveFields } = user;
    return userWithoutSensitiveFields;
};
const verifyEmail = async ({ token }) => {
    // 1. Hash token
    const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    // 2. Find user
    const user = await prisma.user.findFirst({
        where: {
            emailVerifyToken: hashedToken,
            emailVerifyExpiry: { gt: new Date() },
        },
    });
    console.log("USER FOUND:", user);
    if (!user) {
        throw new ApiError(400, "Invalid or expired verification token");
    }
    console.log("INVITE TOKEN:", user.inviteToken);
    // 3. Transaction — verify + create org member
    await prisma.$transaction(async (tx) => {
        // Verify user
        await tx.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                emailVerifyToken: null,
                emailVerifyExpiry: null,
            },
        });
        // Had an invite token? Create org member
        if (user.inviteToken) {
            const invite = await tx.orgInvite.findFirst({
                where: {
                    token: user.inviteToken,
                    isUsed: false,
                    expiry: { gt: new Date() },
                },
            });
            if (invite) {
                // Create org member
                await tx.orgMember.create({
                    data: {
                        userId: user.id,
                        orgId: invite.orgId,
                    },
                });
                // Mark invite used
                await tx.orgInvite.update({
                    where: { id: invite.id },
                    data: { isUsed: true },
                });
            }
        }
        // Clear inviteToken
        await tx.user.update({
            where: { id: user.id },
            data: { inviteToken: null },
        });
    });
    return true;
};
const magicLinkLogin = async (token) => {
    if (!token)
        throw new ApiError(400, "Magic link token is required");
    // 1. Hash incoming token and find user
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
        where: {
            magicLinkToken: hashedToken,
            magicLinkExpiry: { gt: new Date() },
        },
    });
    if (!user)
        throw new ApiError(400, "Invalid or expired magic link");
    // 2. Find most recent unused ProjectInvite for this user's email
    const invite = await prisma.projectInvite.findFirst({
        where: {
            email: user.email,
            isUsed: false,
            expiry: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        include: { project: true },
    });
    if (!invite)
        throw new ApiError(400, "No valid project invite found");
    // 3. Transaction: add to project, handle org membership, mark invite used, clear magic token
    await prisma.$transaction(async (tx) => {
        await tx.projectMember.create({
            data: {
                userId: user.id,
                projectId: invite.projectId,
                role: invite.role,
            },
        });
        const existingOrgMember = await tx.orgMember.findUnique({
            where: {
                userId_orgId: { userId: user.id, orgId: invite.project.orgId },
            },
        });
        if (!existingOrgMember) {
            await tx.orgMember.create({
                data: { userId: user.id, orgId: invite.project.orgId, role: "MEMBER" },
            });
        }
        await tx.projectInvite.update({
            where: { id: invite.id },
            data: { isUsed: true },
        });
        await tx.user.update({
            where: { id: user.id },
            data: { magicLinkToken: null, magicLinkExpiry: null },
        });
    });
    // 4. Generate tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });
    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });
    // 5. Return user (strip sensitive fields) + tokens + project info
    const { password: _password, passwordResetToken: _prt, passwordResetExpiry: _pre, emailVerifyToken: _evt, emailVerifyExpiry: _eve, inviteToken: _it, magicLinkToken: _mlt, magicLinkExpiry: _mle, isOwner: _io, ...safeUser } = user;
    return {
        user: { ...safeUser, role: invite.role },
        accessToken,
        refreshToken,
        project: {
            id: invite.project.id,
            name: invite.project.name,
            role: invite.role,
        },
    };
};
export { registerUser, loginUser, refreshAccessToken, logoutUser, forgotPassword, resetPassword, registerOwner, verifyEmail, magicLinkLogin, };
//# sourceMappingURL=auth.service.js.map