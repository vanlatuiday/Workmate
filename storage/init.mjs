// Tạo hai bucket nếu chưa có (chạy được nhiều lần). Dùng: npm run storage:init
import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n').filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')] }),
)
const s3 = new S3Client({
  endpoint: env.STORAGE_ENDPOINT, region: env.STORAGE_REGION, forcePathStyle: true,
  credentials: { accessKeyId: env.STORAGE_ACCESS_KEY, secretAccessKey: env.STORAGE_SECRET_KEY },
})
for (const Bucket of [env.STORAGE_BUCKET_PUBLIC, env.STORAGE_BUCKET_PRIVATE]) {
  try { await s3.send(new HeadBucketCommand({ Bucket })); console.log(`có sẵn: ${Bucket}`) }
  catch { await s3.send(new CreateBucketCommand({ Bucket })); console.log(`đã tạo: ${Bucket}`) }
}
