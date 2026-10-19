import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getUsersCollection } from "@/lib/db";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMongoSrvResolutionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "syscall" in error &&
    error.syscall === "querySrv"
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { message: "Vui lòng nhập email và mật khẩu." },
      { status: 400 },
    );
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length < 8 ||
    password.length > 72 ||
    new TextEncoder().encode(password).length > 72
  ) {
    return NextResponse.json(
      { message: "Email hoặc mật khẩu không đúng." },
      { status: 401 },
    );
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json(
        { message: "Email hoặc mật khẩu không đúng." },
        { status: 401 },
      );
    }

    const session = await createSessionToken(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      body.remember === true,
    );
    const response = NextResponse.json({
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    if (isMongoSrvResolutionError(error)) {
      return NextResponse.json(
        {
          message:
            "Máy chủ không phân giải được DNS MongoDB. Hãy kiểm tra MONGODB_DNS_SERVERS trong .env.local rồi khởi động lại máy chủ.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { message: "Không thể đăng nhập lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
