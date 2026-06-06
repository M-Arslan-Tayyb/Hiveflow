import { Router } from "express";
import * as authController from "../../modules/auth/auth.controller.js";
import validate from "../../middlewares/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, registerOwnerSchema, verifyEmailSchema, } from "../../modules/auth/auth.validator.js";
import { registerLimiter, authLimiter } from "../../middlewares/rateLimitar.js";
import authenticate from "../../middlewares/auth/authenticate.js";
const router = Router();
router.post("/register", registerLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.post("/register-owner", validate(registerOwnerSchema), authController.registerOwner);
router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail);
router.get("/magic-link", authController.magicLinkLogin);
// Test route — only logged-in users can access
router.get("/me", authenticate, (req, res) => {
    res.status(200).json({
        success: true,
        data: req.user,
    });
});
export default router;
//# sourceMappingURL=auth.route.js.map