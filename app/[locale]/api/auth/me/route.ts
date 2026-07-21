import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/user-session";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser();

    // "Nobody is signed in" is the expected state for every anonymous visitor,
    // not an error. Answering 401 made the browser log a failed request to the
    // console on every cold page load, which Lighthouse reports under Best
    // Practices. The shape stays the same, so callers just read `user: null`.
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // A non-empty passwordHash means the account was created with email/password;
    // otherwise it was provisioned through Google OAuth.
    const loginMethod: "email" | "google" =
      user.passwordHash && user.passwordHash.length > 0 ? "email" : "google";

    return NextResponse.json(
      {
        user: {
          id: user._id?.toString(),
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          memberSince: user.createdAt,
          loginMethod,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
