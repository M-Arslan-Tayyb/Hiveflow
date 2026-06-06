import jwt from "jsonwebtoken";
import prisma from "../../config/db.js";
import config from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
const authenticate = asyncHandler(async (req, res, next) => {
    // 1. Get token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Access token required" });
        return;
    }
    const token = authHeader.split(" ")[1];
    // 2. Verify token
    const decoded = jwt.verify(token, config.jwt.accessSecret);
    // 3. Fetch user
    const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
            isVerified: true,
            isActive: true,
            isOwner: true,
        },
    });
    if (!user) {
        throw new ApiError(401, "Invalid token");
    }
    if (!user.isActive) {
        res.status(403).json({ message: "Account is deactivated" });
        return;
    }
    // 4. Attach user to the request
    req.user = user;
    next();
});
export default authenticate;
//# sourceMappingURL=authenticate.js.map