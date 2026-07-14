import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { getVacancyById } from "@/services/vacancy-service";
import { getApplicationById } from "@/services/vacancy-application-service";
import { sendApplicationStatusEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifyAdminSession(token);
}

/** Emails the applicant about the current decision (accepted/rejected) on their application. */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await verifyAdmin();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await params;
    if (!ObjectId.isValid(applicationId)) {
      return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });
    }

    const application = await getApplicationById(applicationId);
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (!application.userEmail) {
      return NextResponse.json(
        { error: "This applicant has no email address on file" },
        { status: 400 },
      );
    }

    const vacancy = await getVacancyById(application.vacancyId);
    const vacancyTitle = vacancy?.titleEn || vacancy?.titleNp || "the position";

    await sendApplicationStatusEmail({
      to: application.userEmail,
      applicantName: application.userFullName,
      vacancyTitle,
      status: application.status,
      rejectionReason: application.rejectionReason,
    });

    return NextResponse.json(
      { message: `Email sent to ${application.userEmail}` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending applicant email:", error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 },
    );
  }
}
