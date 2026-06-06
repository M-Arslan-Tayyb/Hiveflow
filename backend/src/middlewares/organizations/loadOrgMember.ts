import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";
import asyncHandler from "@/utils/asyncHandler.js";

const loadOrgMember = asyncHandler(async (req, _res, next) => {
  const { orgId } = req.params as { orgId: string };

  const orgMember = await prisma.orgMember.findUnique({
    where: {
      userId_orgId: {
        userId: req.user!.id,
        orgId,
      },
    },
  });

  if (!orgMember) {
    throw new ApiError(403, "You are not a member of this organization");
  }

  req.orgMember = orgMember;
  next();
});

export default loadOrgMember;
