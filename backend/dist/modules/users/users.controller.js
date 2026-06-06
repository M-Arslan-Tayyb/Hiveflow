import * as usersService from "../../modules/users/users.service.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
const lookupUser = asyncHandler(async (req, res) => {
    const email = req.query.email;
    if (!email)
        throw new ApiError(400, "email query parameter is required");
    const result = await usersService.lookupUserByEmail(email);
    res.status(200).json(new ApiResponse(200, "User lookup successful", result));
});
export { lookupUser };
//# sourceMappingURL=users.controller.js.map