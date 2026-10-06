import { SupabaseClient, User } from "@supabase/supabase-js";

export async function upsertUser(supabase: SupabaseClient, user: User) {
  const meta = user.user_metadata ?? {};

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: meta.full_name ?? meta.name ?? null,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      tenant_id: meta.tenant_id ?? meta.tid ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) console.error("[upsertUser]", error.message);
}
