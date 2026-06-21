import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/config/s3.js";
import config from "@/config/env.js";

const PRESIGNED_URL_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

const uploadToS3 = async (file: Express.Multer.File, taskId: string) => {
  const key = `attachments/${taskId}/${Date.now()}-${file.originalname}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.aws.bucketName!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentLength: file.size,
    })
  );

  return { key };
};

const getPresignedUrl = async (key: string): Promise<string> => {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: config.aws.bucketName!, Key: key }),
    { expiresIn: PRESIGNED_URL_EXPIRY_SECONDS }
  );
};

const deleteFromS3 = async (key: string): Promise<true> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.aws.bucketName!,
      Key: key,
    })
  );
  return true;
};

export { uploadToS3, deleteFromS3, getPresignedUrl };
