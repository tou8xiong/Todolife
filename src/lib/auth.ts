import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "./firebase-admin";

/**
 * Verifies the Firebase ID token from the Authorization header.
 * Returns the verified email or a 401 error response.
 */
export async function verifyAuth(
  req: NextRequest
): Promise<{ email: string } | { error: NextResponse }> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      error: NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.slice(7);
  const adminSDK = getFirebaseAdmin();

  if (!adminSDK) {
    return {
      error: NextResponse.json(
        { error: "Auth service not configured" },
        { status: 503 }
      ),
    };
  }

  try {
    const decoded = await adminSDK.auth().verifyIdToken(token);
    const email = decoded.email;

    if (!email) {
      return {
        error: NextResponse.json(
          { error: "No email associated with this account" },
          { status: 401 }
        ),
      };
    }

    return { email };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }
}
