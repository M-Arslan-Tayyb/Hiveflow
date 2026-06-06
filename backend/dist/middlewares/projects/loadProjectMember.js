import prisma from "../../config/db.js";
import asyncHandler from "../../utils/asyncHandler.js";
const loadProjectMember = asyncHandler(async (req, _res, next) => {
    const { projectId } = req.params;
    const projectMember = await prisma.projectMember.findUnique({
        where: {
            userId_projectId: {
                userId: req.user.id,
                projectId,
            },
        },
    });
    req.projectMember = projectMember || null;
    next();
});
export default loadProjectMember;
//# sourceMappingURL=loadProjectMember.js.map