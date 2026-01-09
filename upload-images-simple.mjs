import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const ENV = {
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL,
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY
};

function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, '');
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

function buildUploadUrl(baseUrl, relKey) {
  const url = new URL('v1/storage/upload', ensureTrailingSlash(baseUrl));
  url.searchParams.set('path', normalizeKey(relKey));
  return url;
}

function toFormData(data, contentType, fileName) {
  const blob = new Blob([data], { type: contentType });
  const form = new FormData();
  form.append('file', blob, fileName || 'file');
  return form;
}

async function storagePut(relKey, data, contentType = 'application/octet-stream') {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split('/').pop() ?? key);
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status}): ${message}`);
  }
  
  const result = await response.json();
  return { key, url: result.url };
}

const imagesDir = '/home/ubuntu/images';
const imageFiles = readdirSync(imagesDir).filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));

console.log(`Found ${imageFiles.length} images to upload`);

const uploadedImages = [];

for (const filename of imageFiles) {
  const filePath = join(imagesDir, filename);
  const buffer = readFileSync(filePath);
  
  const ext = filename.split('.').pop().toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
  
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileKey = `products/${cleanName}`;
  
  console.log(`Uploading ${filename}...`);
  const result = await storagePut(fileKey, buffer, contentType);
  
  uploadedImages.push({
    original: filename,
    key: result.key,
    url: result.url
  });
  
  console.log(`✓ Uploaded: ${result.url}`);
}

console.log('\n=== Upload Complete ===');
writeFileSync('/home/ubuntu/uploaded-images.json', JSON.stringify(uploadedImages, null, 2));
console.log('Results saved to /home/ubuntu/uploaded-images.json');
