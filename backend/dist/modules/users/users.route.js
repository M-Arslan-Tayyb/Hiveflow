import { Router } from "express";
import * as usersController from "../../modules/users/users.controller.js";
import authenticate from "../../middlewares/auth/authenticate.js";
const router = Router();
router.get("/lookup", authenticate, usersController.lookupUser);
export default router;
//# sourceMappingURL=users.route.js.map