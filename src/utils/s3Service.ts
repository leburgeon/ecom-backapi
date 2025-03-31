import { PutObjectCommand, S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { MulterImage } from "../types";
import config from "./config";

// s3Client can be shared between commands
const s3Client = new S3Client()

// Method for uploading an image given a key
const uploader = async (file: MulterImage, imageKey: string) => {
  const param = {
    Bucket: config.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer
  }

  return s3Client.send(new PutObjectCommand(param))
}

// Method for deleting an image given a key
const deleteImage = async (imageKey:string) => {
  const  param = {
    Bucket: config.AWS_BUCKET_NAME,
    Key: imageKey
  }

  return s3Client.send(new DeleteObjectCommand(param))
}

export default {uploader, deleteImage}