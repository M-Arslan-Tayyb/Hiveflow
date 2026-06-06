import type { OrgMember, ProjectMember } from "@prisma/client";

/**
 * The authenticated user attached to `req.user` by the authenticate middleware.
 * Mirrors the Prisma `select` used in middlewares/auth/authenticate.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatar: string | null;
  isVerified: boolean;
  isActive: boolean;
  isOwner: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      orgMember?: OrgMember;
      projectMember?: ProjectMember | null;
    }
  }
}

export {};
