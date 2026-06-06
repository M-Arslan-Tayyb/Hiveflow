import { RequestHandler } from "express";
import { OrgRole, ProjectRole } from "@prisma/client";
import ApiError from "@/utils/ApiError.js";

export const authorizeOrgRole = (...roles: OrgRole[]): RequestHandler => {
  return (req, _res, next) => {
    const userRole = req.orgMember?.role;

    if (!userRole) {
      throw new ApiError(403, "Access denied");
    }

    if (!roles.includes(userRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }

    next();
  };
};

export const authorizeProjectRole = (
  ...roles: ProjectRole[]
): RequestHandler => {
  return (req, _res, next) => {
    const userRole = req.projectMember?.role;

    if (!userRole) {
      throw new ApiError(403, "Access denied");
    }

    if (!roles.includes(userRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action"
      );
    }

    next();
  };
};
