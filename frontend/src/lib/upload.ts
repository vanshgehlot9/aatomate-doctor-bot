"use server";

import crypto from "crypto";
import fs from "fs";
import path from "path";

// Read from parent .env to avoid duplicating config
function getCloudinaryCredentials() {
  try {
    const envPath = path.join(process.cwd(), '../.env');
    if (!fs.existsSync(envPath)) return null;
    
    const content = fs.readFileSync(envPath, 'utf-8');
    const getVal = (key: string) => {
      const match = content.match(new RegExp(`${key}=(.*)`));
      return match ? match[1].trim() : '';
    };

    return {
      cloudName: getVal('CLOUDINARY_CLOUD_NAME') || process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: getVal('CLOUDINARY_API_KEY') || process.env.CLOUDINARY_API_KEY,
      apiSecret: getVal('CLOUDINARY_API_SECRET') || process.env.CLOUDINARY_API_SECRET
    };
  } catch (e) {
    return {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    };
  }
}

export async function uploadImageToCloudinary(base64Image: string): Promise<string> {
  const creds = getCloudinaryCredentials();
  
  if (!creds || !creds.cloudName || !creds.apiKey || !creds.apiSecret) {
    throw new Error("Missing Cloudinary credentials in .env file.");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const strToSign = `timestamp=${timestamp}${creds.apiSecret}`;
  const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("api_key", creds.apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error?.message || "Failed to upload image");
  }

  return data.secure_url;
}
