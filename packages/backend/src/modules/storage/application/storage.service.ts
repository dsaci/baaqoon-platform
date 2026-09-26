import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private endpoint: string;

  constructor(private configService: ConfigService) {
    this.endpoint =
      this.configService.get<string>("MINIO_ENDPOINT") ||
      "http://localhost:9000";

    this.s3Client = new S3Client({
      region: "us-east-1", // MinIO default
      endpoint: this.endpoint,
      forcePathStyle: true, // Required for MinIO
      credentials: {
        accessKeyId:
          this.configService.get<string>("MINIO_ACCESS_KEY") ||
          "baaqoon_storage_admin",
        secretAccessKey:
          this.configService.get<string>("MINIO_SECRET_KEY") ||
          "baaqoon_storage_secret",
      },
    });
  }

  /**
   * Generates a presigned URL allowing the client (React) to upload a file directly to MinIO
   * bypassing the NestJS server for better performance and scalability.
   */
  async getUploadPresignedUrl(
    bucketName: string,
    objectKey: string,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        ContentType: contentType,
      });

      // URL valid for 15 minutes
      return await getSignedUrl(this.s3Client, command, { expiresIn: 900 });
    } catch (error) {
      throw new InternalServerErrorException("فشل في توليد رابط الرفع المباشر");
    }
  }

  /**
   * Generates a presigned URL allowing the client to securely download a private file
   */
  async getDownloadPresignedUrl(
    bucketName: string,
    objectKey: string,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      });

      // URL valid for 60 minutes
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      throw new InternalServerErrorException("فشل في توليد رابط التحميل");
    }
  }
}
