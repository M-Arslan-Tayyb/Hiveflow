import { Request, Response } from "express";
import * as commentService from "@/modules/projects/tasks/comments/comments.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";

const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };
  const { content, parentId } = req.body;

  const comment = await commentService.createComment({
    taskId,
    projectId,
    orgId,
    content,
    parentId,
    authorId: req.user!.id,
  });

  res.status(201).json(new ApiResponse(201, "Comment created successfully", comment));
});

const getComments = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
  };

  const comments = await commentService.getComments({ taskId, projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Comments fetched successfully", comments));
});

const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId, commentId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
    commentId: string;
  };
  const { content } = req.body;

  const comment = await commentService.updateComment({
    commentId,
    taskId,
    projectId,
    orgId,
    content,
    requestingUserId: req.user!.id,
  });

  res.status(200).json(new ApiResponse(200, "Comment updated successfully", comment));
});

const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, taskId, commentId } = req.params as {
    orgId: string;
    projectId: string;
    taskId: string;
    commentId: string;
  };

  await commentService.deleteComment({
    commentId,
    taskId,
    projectId,
    orgId,
    requestingUserId: req.user!.id,
  });

  res.status(200).json(new ApiResponse(200, "Comment deleted successfully"));
});

export { createComment, getComments, updateComment, deleteComment };
