import { Router } from "express";
import * as projectController from "../../modules/projects/projects.controller.js";
import validate from "../../middlewares/validate.js";
import authenticate from "../../middlewares/auth/authenticate.js";
import loadOrgMember from "../../middlewares/organizations/loadOrgMember.js";
import { authorizeOrgRole } from "../../middlewares/auth/authorize.js";
import { createProjectSchema, updateProjectSchema, } from "../../modules/projects/projects.validation.js";
import membersRouter from "../../modules/projects/members/members.routes.js";
const router = Router();
router.use("/:orgId/projects/:projectId/members", membersRouter);
router.post("/:orgId/projects", authenticate, loadOrgMember, authorizeOrgRole("OWNER", "ADMIN"), validate(createProjectSchema), projectController.createProject);
router.get("/:orgId/projects", authenticate, loadOrgMember, projectController.getProjects);
router.get("/:orgId/projects/:projectId", authenticate, loadOrgMember, projectController.getProject);
router.patch("/:orgId/projects/:projectId", authenticate, loadOrgMember, authorizeOrgRole("OWNER", "ADMIN"), validate(updateProjectSchema), projectController.updateProject);
router.delete("/:orgId/projects/:projectId", authenticate, loadOrgMember, authorizeOrgRole("OWNER", "ADMIN"), projectController.deleteProject);
export default router;
//# sourceMappingURL=projects.routes.js.map