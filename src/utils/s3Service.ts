import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "dotenv";
config()
import { MulterImage } from "../types";

export const uploader = async (file: MulterImage) => {
  const s3Client = new S3Client()

  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `images/123-${file.originalname}`,
    Body: file.buffer
  }

  return s3Client.send(new PutObjectCommand(param))
}