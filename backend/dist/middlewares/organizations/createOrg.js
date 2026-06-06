import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
const isOwner = asyncHandler(async (req, _res, next) => {
    if (!req.user.isOwner) {
        throw new ApiError(403, "Only owners can create organizations");
    }
    next();
});
export default isOwner;
//# sourceMappingURL=createOrg.js.map