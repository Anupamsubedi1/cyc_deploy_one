import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { uploadCloudinaryFile } from "@/lib/cloudinary";

/**
 * POST /api/admin/vacancies/upload-notice-pdf
 *
 * Admin-only endpoint. Accepts a multipart form with a single PDF file field
 * named "pdf", uploads it to Cloudinary as a raw file, and returns the
 * secure_url and public_id.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify admin is logged in
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const session = await verifyAdminSession(token);
    if (!session || !session.sub) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("pdf");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided" },
        { status: 400 },
      );
    }

    // Validate file is a PDF
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 },
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadCloudinaryFile(buffer, file.name, {
      folder: "vacancy-notices",
      resourceType: "raw",
    });

    return NextResponse.json(
      {
        secure_url: result.secure_url,
        public_id: result.public_id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error uploading vacancy notice PDF:", error);
    return NextResponse.json(
      { error: "Failed to upload PDF" },
      { status: 500 },
    );
  }
}
