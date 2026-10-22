import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import {
  getGoogleOAuthConfig,
  GOOGLE_NONCE_COOKIE,
  GOOGLE_STATE_COOKIE,
} from "@/lib/google-oauth";
import {
  getUsersCollection,
  isDuplicateEmailError,
  type UserRole,
} from "@/lib/db";

function matchesState(expected: string | undefined, received: string | null) {
  if (!expected || !received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

function redirectToLogin(callbackUrl: string, reason: string) {
  const loginUrl = new URL("/login", callbackUrl);
  loginUrl.searchParams.set("google", reason);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  let callbackUrl: string;
  try {
    const config = getGoogleOAuthConfig();
    callbackUrl = config.callbackUrl;

    const requestUrl = new URL(request.url);
    const state = requestUrl.searchParams.get("state");
    const code = requestUrl.searchParams.get("code");
    const cookieStore = await cookies();
    const savedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
    const savedNonce = cookieStore.get(GOOGLE_NONCE_COOKIE)?.value;

    if (!matchesState(savedState, state) || !savedNonce) {
      return redirectToLogin(callbackUrl, "failed");
    }

    if (requestUrl.searchParams.has("error") || !code) {
      return redirectToLogin(callbackUrl, "cancelled");
    }

    const { tokens } = await config.client.getToken(code);
    if (!tokens.id_token) {
      return redirectToLogin(callbackUrl, "failed");
    }

    const ticket = await config.client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.clientId,
    });
    const profile = ticket.getPayload();
    if (
      !profile?.sub ||
      !profile.email ||
      profile.email_verified !== true ||
      profile.nonce !== savedNonce
    ) {
      return redirectToLogin(callbackUrl, "failed");
    }

    const email = profile.email.trim().toLowerCase();
    const users = await getUsersCollection();
    let user = await users.findOne({ email });

    if (!user) {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const role: UserRole = email === adminEmail ? "admin" : "user";

      try {
        const result = await users.insertOne({
          name: (profile.name?.trim() || email.split("@")[0]).slice(0, 100),
          phone: "",
          email,
          address: "",
          role,
          createdAt: new Date(),
        });
        user = await users.findOne({ _id: result.insertedId });
      } catch (error) {
        if (!isDuplicateEmailError(error)) {
          throw error;
        }
        user = await users.findOne({ email });
      }
    }

    if (!user) {
      return redirectToLogin(callbackUrl, "failed");
    }

    const session = await createSessionToken(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      true,
    );
    const response = NextResponse.redirect(new URL("/account", callbackUrl));
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: session.maxAge,
    });
    response.cookies.set(GOOGLE_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: 0,
    });
    response.cookies.set(GOOGLE_NONCE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/google",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Google sign-in callback failed:", error);
    const configuredCallbackUrl = process.env.AUTH_GOOGLE_CALLBACK_URL;
    if (!configuredCallbackUrl) {
      return NextResponse.json(
        { message: "Đăng nhập Google chưa được cấu hình đầy đủ." },
        { status: 503 },
      );
    }
    return redirectToLogin(configuredCallbackUrl, "failed");
  }
}
