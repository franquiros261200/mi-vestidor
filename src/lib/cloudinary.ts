import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  base64Data: string,
  folder = "mi-vestidor"
) {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder,
    transformation: [
      { width: 800, height: 800, crop: "limit", quality: "auto" },
    ],
  });

  // Thumbnail para grilla
  const thumbUrl = cloudinary.url(result.public_id, {
    transformation: [
      { width: 300, height: 300, crop: "fill", gravity: "auto", quality: "auto" },
    ],
  });

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
    thumbUrl,
  };
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
