import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/AppShell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Sin credenciales configuradas — mostramos el layout en modo preview
  }

  const isDev = process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co";
  if (!user && !isDev) redirect("/login");

  const meta = user?.user_metadata ?? {};
  const name: string = meta.full_name ?? meta.name ?? user?.email ?? "Preview User";
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <AppShell
      user={{
        name,
        email: user?.email ?? "preview@flock.app",
        avatar: meta.avatar_url ?? meta.picture ?? null,
        initials,
      }}
    >
      {children}
    </AppShell>
  );
}
