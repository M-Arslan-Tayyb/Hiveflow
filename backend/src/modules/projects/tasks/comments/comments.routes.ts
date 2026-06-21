import { Router } from "express";
import * as commentController from "@/modules/projects/tasks/comments/comments.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import loadProjectMember from "@/middlewares/projects/loadProjectMember.js";
import requireOrgOrProjectMember from "@/middlewares/projects/requireOrgOrProjectMember.js";
import {
  createCommentSchema,
  updateCommentSchema,
} from "@/modules/projects/tasks/comments/comments.validation.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireOrgOrProjectMember,
  validate(createCommentSchema),
  commentController.createComment
);

router.get(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireOrgOrProjectMember,
  commentController.getComments
);

router.patch(
  "/:commentId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireOrgOrProjectMember,
  validate(updateCommentSchema),
  commentController.updateComment
);

router.delete(
  "/:commentId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  requireOrgOrProjectMember,
  commentController.deleteComment
);

export default router;
