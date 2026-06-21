import { RequestHandler } from "express";
import ApiError from "@/utils/ApiError.js";

const requireOrgOrProjectMember: RequestHandler = (req, _res, next) => {
  if (req.orgMember || req.projectMember) {
    return next();
  }
  throw new ApiError(403, "You must be an org or project member");
};

export default requireOrgOrProjectMember;
