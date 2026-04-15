import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import { Resend } from "resend";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const { data, error } = await resend.emails.send({
      from: "TodoLife <onboarding@resend.dev>",
      to: email,
      subject: "Reset Your Password - TodoLife",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0ea5e9;">Reset Your Password</h1>
          <p>Click the button below to reset your password:</p>
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(to right, #0ea5e9, #06b6d4); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
          <p style="margin-top: 20px; color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Email sent:", data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password reset error:", error);

    if (error.code === "auth/user-not-found") {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
