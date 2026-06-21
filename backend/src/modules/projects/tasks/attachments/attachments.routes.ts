import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import * as attachmentController from "@/modules/projects/tasks/attachments/attachments.controller.js";
import authenticate from "@/middlewares/auth/authenticate.js";
import loadOrgMember from "@/middlewares/organizations/loadOrgMember.js";
import loadProjectMember from "@/middlewares/projects/loadProjectMember.js";
import requireOrgOrProjectMember from "@/middlewares/projects/requireOrgOrProjectMember.js";
import { upload } from "@/config/multer.js";
import ApiError from "@/utils/ApiError.js";

const router = Router({ mergeParams: true });

const handleFileUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err?: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "File size must be less than 5MB"));
    }
    next(err as Error);
  });
};

const authChain = [authenticate, loadOrgMember, loadProjectMember, requireOrgOrProjectMember];

router.post("/", ...authChain, handleFileUpload, attachmentController.uploadAttachment);
router.get("/", ...authChain, attachmentController.getAttachments);
router.delete("/:attachmentId", ...authChain, attachmentController.deleteAttachment);

export default router;
