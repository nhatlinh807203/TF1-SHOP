import Header from "@/components/Header";
import { getSession } from "@/lib/auth";

export default async function HeaderWithSession() {
  const session = await getSession();

  const initialUser = session
    ? {
        name: session.name,
        email: session.email,
        role: session.role,
      }
    : null;

  return <Header initialUser={initialUser} />;
}
