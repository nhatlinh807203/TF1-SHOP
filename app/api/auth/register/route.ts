import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import {
  getUsersCollection,
  isDuplicateEmailError,
  type UserRole,
} from "@/lib/db";

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

  if (!isRecord(body)) {
    return NextResponse.json({ message: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  const { name, phone, email, address, password } = body;
  if (
    typeof name !== "string" ||
    typeof phone !== "string" ||
    typeof email !== "string" ||
    typeof address !== "string" ||
    typeof password !== "string"
  ) {
    return NextResponse.json({ message: "Vui lòng điền đầy đủ thông tin." }, { status: 400 });
  }

  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedAddress = address.trim();
  const phoneDigits = normalizedPhone.replace(/\D/g, "");

  if (normalizedName.length < 2 || normalizedName.length > 100) {
    return NextResponse.json({ message: "Họ tên cần có từ 2 đến 100 ký tự." }, { status: 400 });
  }
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return NextResponse.json({ message: "Email chưa đúng định dạng." }, { status: 400 });
  }
  if (
    !/^[+\d\s().-]+$/.test(normalizedPhone) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    return NextResponse.json({ message: "Số điện thoại chưa đúng định dạng." }, { status: 400 });
  }
  if (normalizedAddress.length < 5 || normalizedAddress.length > 250) {
    return NextResponse.json({ message: "Địa chỉ cần có từ 5 đến 250 ký tự." }, { status: 400 });
  }
  if (
    password.length < 8 ||
    password.length > 72 ||
    new TextEncoder().encode(password).length > 72
  ) {
    return NextResponse.json(
      { message: "Mật khẩu cần có ít nhất 8 ký tự và tối đa 72 byte." },
      { status: 400 },
    );
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const role: UserRole = normalizedEmail === adminEmail ? "admin" : "user";

  try {
    const users = await getUsersCollection();
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await users.insertOne({
      name: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail,
      address: normalizedAddress,
      passwordHash,
      role,
      createdAt: new Date(),
    });

    const session = await createSessionToken(
      {
        id: result.insertedId.toString(),
        email: normalizedEmail,
        name: normalizedName,
        role,
      },
      true,
    );
    const response = NextResponse.json(
      {
        user: {
          name: normalizedName,
          email: normalizedEmail,
          role,
        },
      },
      { status: 201 },
    );
    response.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: session.maxAge,
    });
    return response;
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return NextResponse.json(
        { message: "Email này đã được đăng ký." },
        { status: 409 },
      );
    }

    console.error("Registration failed:", error);
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
      { message: "Không thể tạo tài khoản lúc này. Vui lòng thử lại sau." },
      { status: 500 },
    );
  }
}
