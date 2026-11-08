// Tạo hai bucket nếu chưa có (chạy được nhiều lần). Dùng: npm run storage:init
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { existsSync } from 'node:fs'

// Ưu tiên biến môi trường có sẵn (nơi host); trên máy thì đọc từ file .env
const envUrl = new URL('../.env', import.meta.url)
if (existsSync(envUrl)) process.loadEnvFile(envUrl)
const env = process.env
const s3 = new S3Client({
  endpoint: env.STORAGE_ENDPOINT, region: env.STORAGE_REGION, forcePathStyle: true,
  credentials: { accessKeyId: env.STORAGE_ACCESS_KEY, secretAccessKey: env.STORAGE_SECRET_KEY },
})
for (const Bucket of [env.STORAGE_BUCKET_PUBLIC, env.STORAGE_BUCKET_PRIVATE]) {
  try { await s3.send(new HeadBucketCommand({ Bucket })); console.log(`có sẵn: ${Bucket}`) }
  catch { await s3.send(new CreateBucketCommand({ Bucket })); console.log(`đã tạo: ${Bucket}`) }
}
