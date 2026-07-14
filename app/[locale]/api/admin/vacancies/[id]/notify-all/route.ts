import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";
import { verifyAdminSession, ADMIN_SESSION_COOKIE } from "@/lib/admin-session";
import { getVacancyById } from "@/services/vacancy-service";
import { getApplicationsByVacancyId } from "@/services/vacancy-application-service";
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

// Only applicants with a final decision are notified; "accepted" covers shortlisted/approved.
const DECIDED_STATUSES = new Set(["approved", "selected", "rejected"]);

/** Emails every decided applicant of a vacancy their accept/reject outcome. */
export async function POST(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const session = await verifyAdmin();
    if (!session || !session.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: vacancyId } = await params;
    if (!ObjectId.isValid(vacancyId)) {
      return NextResponse.json({ error: "Invalid vacancy ID" }, { status: 400 });
    }

    const vacancy = await getVacancyById(vacancyId);
    if (!vacancy) {
      return NextResponse.json({ error: "Vacancy not found" }, { status: 404 });
    }
    const vacancyTitle = vacancy.titleEn || vacancy.titleNp || "the position";

    const applications = await getApplicationsByVacancyId(vacancyId);
    const recipients = applications.filter(
      (app) => DECIDED_STATUSES.has(app.status) && Boolean(app.userEmail),
    );

    let sent = 0;
    const failed: string[] = [];

    // Sent sequentially to stay within Gmail SMTP rate limits.
    for (const app of recipients) {
      try {
        await sendApplicationStatusEmail({
          to: app.userEmail,
          applicantName: app.userFullName,
          vacancyTitle,
          status: app.status,
          rejectionReason: app.rejectionReason,
        });
        sent += 1;
      } catch (err) {
        console.error(`Failed to email ${app.userEmail}:`, err);
        failed.push(app.userEmail);
      }
    }

    const skipped = applications.length - recipients.length;

    return NextResponse.json(
      {
        message: `Sent ${sent} email${sent === 1 ? "" : "s"}.`,
        sent,
        failed: failed.length,
        skipped,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending bulk applicant emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails. Please try again." },
      { status: 500 },
    );
  }
}
