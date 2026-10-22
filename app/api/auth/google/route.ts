import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getGoogleOAuthConfig,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_STATE_COOKIE,
} from "@/lib/google-oauth";

const OAUTH_COOKIE_MAX_AGE = 10 * 60;

export async function GET() {
  try {
    const { client } = getGoogleOAuthConfig();
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const response = NextResponse.redirect(
      client.generateAuthUrl({
        access_type: "online",
        prompt: "select_account",
        scope: ["openid", "email", "profile"],
        state,
        nonce,
      }),
    );
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/api/auth/google",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    };

    response.cookies.set(GOOGLE_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(GOOGLE_NONCE_COOKIE, nonce, cookieOptions);
    return response;
  } catch (error) {
    console.error("Unable to start Google sign-in:", error);
    return NextResponse.json(
      { message: "Đăng nhập Google chưa được cấu hình đầy đủ." },
      { status: 503 },
    );
  }
}
