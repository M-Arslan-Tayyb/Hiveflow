import { Router } from "express";
import * as boardController from "@/modules/projects/boards/boards.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import loadProjectMember from "@/middlewares/projects/loadProjectMember.js";
import { requireProjectMember } from "@/middlewares/projects/authorizeProjectAccess.js";
import {
  createBoardSchema,
  updateBoardSchema,
  updateBoardPositionSchema,
} from "@/modules/projects/boards/boards.validation.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  boardController.getBoards
);

router.post(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(createBoardSchema),
  boardController.createBoard
);

router.patch(
  "/:boardId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(updateBoardSchema),
  boardController.updateBoard
);

router.patch(
  "/:boardId/position",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  validate(updateBoardPositionSchema),
  boardController.updateBoardPosition
);

router.delete(
  "/:boardId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireProjectMember,
  boardController.deleteBoard
);

export default router;
