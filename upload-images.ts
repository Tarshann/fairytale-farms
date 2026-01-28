import { storagePut } from "./server/storage";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const imagesDir = "/home/ubuntu/images";
  const imageFiles = readdirSync(imagesDir).filter(f =>
    f.match(/\.(jpg|jpeg|png|webp)$/i)
  );

  console.log(`Found ${imageFiles.length} images to upload`);

  const uploadedImages = [];

  for (const filename of imageFiles) {
    const filePath = join(imagesDir, filename);
    const buffer = readFileSync(filePath);

    const ext = filename.split(".").pop()!.toLowerCase();
    const contentType = ext === "png" ? "image/png" : "image/jpeg";

    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `products/${cleanName}`;

    console.log(`Uploading ${filename}...`);
    const result = await storagePut(fileKey, buffer, contentType);

    uploadedImages.push({
      original: filename,
      key: result.key,
      url: result.url,
    });

    console.log(`✓ Uploaded: ${result.url}`);
  }

  console.log("\n=== Upload Complete ===");
  writeFileSync(
    "/home/ubuntu/uploaded-images.json",
    JSON.stringify(uploadedImages, null, 2)
  );
  console.log("Results saved to /home/ubuntu/uploaded-images.json");
}

main().catch(console.error);
