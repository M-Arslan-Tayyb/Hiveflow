import { Router } from "express";
import * as memberController from "@/modules/projects/members/members.controller.js";
import validate from "@/middlewares/validate.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import loadProjectMember from "@/middlewares/projects/loadProjectMember.js";
import { authorizeProjectMemberAccess } from "@/middlewares/projects/authorizeProjectAccess.js";
import {
  addMemberSchema,
  updateMemberRoleSchema,
  inviteProjectMemberSchema,
} from "@/modules/projects/members/members.validation.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  authorizeProjectMemberAccess,
  validate(addMemberSchema),
  memberController.addMember
);

router.delete(
  "/:userId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  authorizeProjectMemberAccess,
  memberController.removeMember
);

router.patch(
  "/:userId",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  authorizeProjectMemberAccess,
  validate(updateMemberRoleSchema),
  memberController.updateMemberRole
);

router.post(
  "/invite",
  authenticate,
  loadOrgMember,
  loadProjectMember,
  authorizeProjectMemberAccess,
  validate(inviteProjectMemberSchema),
  memberController.inviteProjectMember
);

export default router;
