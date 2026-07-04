import { Request, Response } from "express";
import * as orgService from "@/modules/organizations/org.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";

const createOrg = asyncHandler(async (req: Request, res: Response) => {
  const { name, slug } = req.body;
  const org = await orgService.createOrg({
    name,
    slug,
    userId: req.user!.id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, "Organization created successfully", org));
});

const getOrg = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };
  const org = await orgService.getOrg({
    orgId,
    userId: req.user!.id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Organization fetched successfully", org));
});

const updateOrg = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };
  const org = await orgService.updateOrg({
    orgId,
    userId: req.user!.id,
    name: req.body.name,
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Organization updated successfully", org));
});

const deleteOrg = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };
  await orgService.deleteOrg({ orgId, userId: req.user!.id });

  res
    .status(200)
    .json(new ApiResponse(200, "Organization deleted successfully"));
});

const getAllOrgs = asyncHandler(async (req: Request, res: Response) => {
  const orgs = await orgService.getAllOrgs({
    userId: req.user!.id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Organizations fetched successfully", orgs));
});

const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };
  await orgService.inviteMember({
    orgId,
    email: req.body.email,
    invitedById: req.user!.id,
  });

  res.status(200).json(new ApiResponse(200, "Invite sent successfully"));
});

const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, userId } = req.params as { orgId: string; userId: string };
  await orgService.removeMember({
    orgId,
    targetUserId: userId,
    requestingUserId: req.user!.id,
  });

  res.status(200).json(new ApiResponse(200, "Member removed successfully"));
});

const getOrgMembers = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = req.params as { orgId: string };
  const members = await orgService.getOrgMembers({
    orgId,
    userId: req.user!.id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, "Members fetched successfully", members));
});

export {
  getOrg,
  createOrg,
  updateOrg,
  deleteOrg,
  getAllOrgs,
  inviteMember,
  removeMember,
  getOrgMembers,
};
