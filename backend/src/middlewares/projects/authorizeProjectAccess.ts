import { RequestHandler } from "express";
import ApiError from "@/utils/ApiError.js";

export const authorizeProjectMemberAccess: RequestHandler = (
  req,
  _res,
  next
) => {
  const orgRole = req.orgMember?.role;
  const projectRole = req.projectMember?.role;

  if (orgRole === "OWNER" || orgRole === "ADMIN" || projectRole === "MANAGER") {
    return next();
  }

  throw new ApiError(403, "You do not have permission to perform this action");
};

export const requireProjectMember: RequestHandler = (req, _res, next) => {
  if (!req.projectMember) {
    throw new ApiError(403, "You must be a project member to perform this action");
  }
  next();
};
