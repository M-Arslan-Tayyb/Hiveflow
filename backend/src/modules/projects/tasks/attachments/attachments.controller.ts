import { Request, Response } from "express";
import * as attachmentService from "@/modules/projects/tasks/attachments/attachments.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import ApiError from "@/utils/ApiError.js";
import asyncHandler from "@/utils/asyncHandler.js";

const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };

  if (!req.file) throw new ApiError(400, "No file provided");

  const attachment = await attachmentService.uploadAttachment({
    file: req.file,
    taskId,
    projectId,
    orgId,
    uploadedById: req.user!.id,
  });

  res.status(201).json(new ApiResponse(201, "Attachment uploaded successfully", attachment));
});

const getAttachments = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };

  const attachments = await attachmentService.getAttachments({ taskId, projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Attachments fetched successfully", attachments));
});

const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId, attachmentId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
    attachmentId: string;
  };

  await attachmentService.deleteAttachment({
    attachmentId,
    taskId,
    projectId,
    orgId,
    requestingUserId: req.user!.id,
  });

  res.status(200).json(new ApiResponse(200, "Attachment deleted successfully"));
});

export { uploadAttachment, getAttachments, deleteAttachment };
