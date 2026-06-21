import prisma from "@/config/db.js";
import ApiError from "@/utils/ApiError.js";
import { uploadToS3, deleteFromS3, getPresignedUrl } from "@/services/s3.service.js";

const uploaderSelect = {
  select: { id: true, fullName: true, email: true, avatar: true },
} as const;

interface UploadAttachmentInput {
  file: Express.Multer.File;
  taskId: string;
  projectId: string;
  orgId: string;
  uploadedById: string;
}

interface GetAttachmentsInput {
  taskId: string;
  projectId: string;
  orgId: string;
}

interface DeleteAttachmentInput {
  attachmentId: string;
  taskId: string;
  projectId: string;
  orgId: string;
  requestingUserId: string;
}

const uploadAttachment = async ({
  file,
  taskId,
  projectId,
  orgId,
  uploadedById,
}: UploadAttachmentInput) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, project: { orgId } },
  });
  if (!task) throw new ApiError(404, "Task not found");

  let key: string;
  try {
    ({ key } = await uploadToS3(file, taskId));
  } catch {
    throw new ApiError(500, "File upload failed");
  }

  const attachment = await prisma.attachment.create({
    data: {
      fileName: file.originalname,
      fileUrl: "",
      fileKey: key,
      fileSize: file.size,
      mimeType: file.mimetype,
      taskId,
      uploadedById,
    },
    include: { uploadedBy: uploaderSelect },
  });

  const fileUrl = await getPresignedUrl(key);
  return { ...attachment, fileUrl };
};

const getAttachments = async ({ taskId, projectId, orgId }: GetAttachmentsInput) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, project: { orgId } },
  });
  if (!task) throw new ApiError(404, "Task not found");

  const attachments = await prisma.attachment.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: uploaderSelect },
  });

  return Promise.all(
    attachments.map(async (a) => ({
      ...a,
      fileUrl: await getPresignedUrl(a.fileKey),
    }))
  );
};

const deleteAttachment = async ({
  attachmentId,
  taskId,
  projectId,
  orgId,
  requestingUserId,
}: DeleteAttachmentInput) => {
  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId, project: { orgId } },
  });
  if (!task) throw new ApiError(404, "Task not found");

  const attachment = await prisma.attachment.findFirst({
    where: { id: attachmentId, taskId },
  });
  if (!attachment) throw new ApiError(404, "Attachment not found");

  if (attachment.uploadedById !== requestingUserId) {
    throw new ApiError(403, "You can only delete your own attachments");
  }

  try {
    await deleteFromS3(attachment.fileKey);
  } catch {
    throw new ApiError(500, "Failed to delete file from storage");
  }

  await prisma.attachment.delete({ where: { id: attachmentId } });
  return true;
};

export { uploadAttachment, getAttachments, deleteAttachment };
