import ApiError from "../../utils/ApiError.js";
export const authorizeProjectMemberAccess = (req, _res, next) => {
    const orgRole = req.orgMember?.role;
    const projectRole = req.projectMember?.role;
    if (orgRole === "OWNER" || orgRole === "ADMIN" || projectRole === "MANAGER") {
        return next();
    }
    throw new ApiError(403, "You do not have permission to perform this action");
};
//# sourceMappingURL=authorizeProjectAccess.js.map