import { Request, Response } from "express";
import * as memberService from "@/modules/projects/members/members.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";

const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as {
    orgId: string;
    projectId: string;
  };
  const { userId, role } = req.body;
  await memberService.addMember({
    projectId,
    orgId,
    userId,
    role,
  });

  res.status(201).json(new ApiResponse(201, "Member added successfully"));
});

const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, userId } = req.params as {
    orgId: string;
    projectId: string;
    userId: string;
  };
  await memberService.removeMember({
    projectId,
    orgId,
    targetUserId: userId.trim(),
    requestingUserId: req.user!.id,
  });

  res.status(200).json(new ApiResponse(200, "Member removed successfully"));
});

const updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, userId } = req.params as {
    orgId: string;
    projectId: string;
    userId: string;
  };
  const updated = await memberService.updateMemberRole({
    projectId,
    orgId,
    targetUserId: userId,
    role: req.body.role,
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Member role updated successfully", updated));
});

const inviteProjectMember = asyncHandler(
  async (req: Request, res: Response) => {
    const { orgId, projectId } = req.params as {
      orgId: string;
      projectId: string;
    };
    const { email, fullName, role } = req.body;
    await memberService.inviteProjectMember({
      projectId,
      orgId,
      email,
      fullName,
      role,
      invitedById: req.user!.id,
    });

    res.status(200).json(new ApiResponse(200, "Invite sent successfully"));
  }
);

export { addMember, removeMember, updateMemberRole, inviteProjectMember };
