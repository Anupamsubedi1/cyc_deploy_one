import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Builds a collision-proof public_id from an uploaded file's name.
 *
 * Every upload helper here used to pass `public_id: fileName.replace(ext, "")`
 * verbatim, which made the Cloudinary asset id equal to whatever the uploader
 * happened to name the file on their own machine. Phone and scanner exports are
 * named things like `1.jpg`, `2.png`, `3.jpg`, so two people uploading their
 * portrait both landed on `hero-sections/1` — and because Cloudinary treats a
 * repeat upload to an existing public_id as an overwrite, the second silently
 * replaced the first. Every DB row still pointing at that id then rendered the
 * wrong person's face, and deleting any one of those records destroyed the
 * single shared asset, 404-ing all the others.
 *
 * The random suffix makes each upload its own asset, so overwrites and
 * cascading deletes are both impossible. Slugifying also removes the spaces and
 * parentheses that previously had to survive URL-encoding round trips.
 */
function uniquePublicId(fileName: string): string {
  const base =
    fileName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";

  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete image from Cloudinary:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
}

export async function deleteCloudinaryFile(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Failed to delete file from Cloudinary:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
}

export function getCloudinaryRawPdfUrl(publicId: string): string {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "raw",
  });
}

export async function uploadToCloudinary(
  file: Buffer,
  fileName: string,
): Promise<{ secure_url: string; public_id: string }> {
  return uploadCloudinaryFile(file, fileName, {
    folder: "hero-sections",
    resourceType: "image",
  });
}

export async function uploadCloudinaryFile(
  file: Buffer,
  fileName: string,
  options: {
    folder: string;
    resourceType: "image" | "raw" | "auto";
  },
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resourceType,
        folder: options.folder,
        public_id: uniquePublicId(fileName),
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Failed to upload ${options.resourceType} file to Cloudinary`));
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Upload completed but no result returned"));
        }
      },
    );

    uploadStream.end(file);
  });
}

export async function uploadPDFToCloudinary(
  file: Buffer,
  fileName: string,
  folder: string = "application-pdfs",
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: folder,
        public_id: uniquePublicId(fileName),
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", JSON.stringify(error, null, 2));
          reject(new Error(`Failed to upload PDF to Cloudinary: ${error.message}`));
        } else if (result) {
          console.log("Cloudinary upload result:", {
            public_id: result.public_id,
            secure_url: result.secure_url,
            resource_type: result.resource_type,
            version: result.version,
          });
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("PDF upload completed but no result returned"));
        }
      },
    );

    uploadStream.end(file);
  });
}

export async function uploadApplicationFileToCloudinary(
  file: Buffer,
  fileName: string,
  fileType: string,
  vacancyId: string,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const extension = fileName.split(".").pop() || "pdf";
    const resourceType = fileType === "pdf" || extension === "pdf" ? "raw" : "auto";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: `job-applications/${vacancyId}`,
        public_id: uniquePublicId(fileName),
      },
      (error, result) => {
        if (error) {
          reject(new Error("Failed to upload file to Cloudinary"));
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("File upload completed but no result returned"));
        }
      },
    );

    uploadStream.end(file);
  });
}
