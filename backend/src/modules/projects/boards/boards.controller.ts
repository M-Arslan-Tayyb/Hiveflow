import { Request, Response } from "express";
import * as boardService from "@/modules/projects/boards/boards.service.js";
import ApiResponse from "@/utils/ApiResponse.js";
import asyncHandler from "@/utils/asyncHandler.js";

const getBoards = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as { orgId: string; projectId: string };
  const boards = await boardService.getBoards({ projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Boards fetched successfully", boards));
});

const createBoard = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId } = req.params as { orgId: string; projectId: string };
  const { name } = req.body;
  const board = await boardService.createBoard({ projectId, orgId, name });
  res.status(201).json(new ApiResponse(201, "Board created successfully", board));
});

const updateBoard = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, boardId } = req.params as {
    orgId: string;
    projectId: string;
    boardId: string;
  };
  const { name } = req.body;
  const board = await boardService.updateBoard({ boardId, projectId, orgId, name });
  res.status(200).json(new ApiResponse(200, "Board updated successfully", board));
});

const updateBoardPosition = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, boardId } = req.params as {
    orgId: string;
    projectId: string;
    boardId: string;
  };
  const { position } = req.body;
  const board = await boardService.updateBoardPosition({ boardId, projectId, orgId, position });
  res.status(200).json(new ApiResponse(200, "Board position updated successfully", board));
});

const deleteBoard = asyncHandler(async (req: Request, res: Response) => {
  const { orgId, projectId, boardId } = req.params as {
    orgId: string;
    projectId: string;
    boardId: string;
  };
  await boardService.deleteBoard({ boardId, projectId, orgId });
  res.status(200).json(new ApiResponse(200, "Board deleted successfully"));
});

export { getBoards, createBoard, updateBoard, updateBoardPosition, deleteBoard };
