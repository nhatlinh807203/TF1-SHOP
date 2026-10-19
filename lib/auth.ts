import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { getUserById, type UserProfile, type UserRole } from "@/lib/db";

const SESSION_COOKIE = "tf1shop_session";
const DAY_IN_SECONDS = 60 * 60 * 24;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 bytes.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: SessionUser,
  remember: boolean,
): Promise<{ token: string; maxAge: number }> {
  const maxAge = DAY_IN_SECONDS * (remember ? 30 : 1);
  const token = await new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .sign(getSessionSecret());

  return { token, maxAge };
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const secret = getSessionSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<UserProfile> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await getUserById(session.id);
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/account");
  }

  return user;
}

export { SESSION_COOKIE, DAY_IN_SECONDS };
