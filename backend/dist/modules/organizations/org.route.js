import { Router } from "express";
import * as orgController from "../../modules/organizations/org.controller.js";
import validate from "../../middlewares/validate.js";
import authenticate from "../../middlewares/auth/authenticate.js";
import { createOrgSchema, updateOrgSchema, inviteMemberSchema, } from "../../modules/organizations/org.validator.js";
import isOwner from "../../middlewares/organizations/createOrg.js";
import loadOrgMember from "../../middlewares/organizations/loadOrgMember.js";
import { authorizeOrgRole } from "../../middlewares/auth/authorize.js";
const router = Router();
router.post("/", authenticate, isOwner, validate(createOrgSchema), orgController.createOrg);
router.get("/:orgId", authenticate, orgController.getOrg);
router.patch("/:orgId", authenticate, loadOrgMember, authorizeOrgRole("OWNER", "ADMIN"), validate(updateOrgSchema), orgController.updateOrg);
router.delete("/:orgId", authenticate, loadOrgMember, authorizeOrgRole("OWNER"), orgController.deleteOrg);
router.get("/", authenticate, orgController.getAllOrgs);
router.post("/:orgId/invite", authenticate, loadOrgMember, authorizeOrgRole("OWNER", "ADMIN"), validate(inviteMemberSchema), orgController.inviteMember);
router.get("/:orgId/members", authenticate, loadOrgMember, orgController.getOrgMembers);
router.delete("/:orgId/members/:userId", authenticate, loadOrgMember, authorizeOrgRole("OWNER"), orgController.removeMember);
export default router;
//# sourceMappingURL=org.route.js.map