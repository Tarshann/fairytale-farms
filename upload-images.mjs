import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.AWS_S3_BUCKET;

function randomSuffix() {
  return randomBytes(4).toString("hex");
}

async function uploadToS3(fileKey, buffer, contentType) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const url = `${process.env.AWS_ENDPOINT_URL_S3}/${bucketName}/${fileKey}`;
  return { key: fileKey, url };
}

const imagesDir = "/home/ubuntu/images";
const imageFiles = readdirSync(imagesDir).filter(f =>
  f.match(/\.(jpg|jpeg|png|webp)$/i)
);

console.log(`Found ${imageFiles.length} images to upload`);

const uploadedImages = [];

for (const filename of imageFiles) {
  const filePath = join(imagesDir, filename);
  const buffer = readFileSync(filePath);

  const ext = filename.split(".").pop().toLowerCase();
  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `products/${cleanName.replace(/\.(jpg|jpeg|png)$/i, "")}-${randomSuffix()}.${ext}`;

  console.log(`Uploading ${filename}...`);
  const result = await uploadToS3(fileKey, buffer, contentType);

  uploadedImages.push({
    original: filename,
    key: result.key,
    url: result.url,
  });

  console.log(`✓ Uploaded: ${result.url}`);
}

console.log("\n=== Upload Complete ===");
console.log(JSON.stringify(uploadedImages, null, 2));
