"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithEmail(formData: FormData) {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[signInWithEmail] Supabase error:", error.status, error.message);
    redirect(`/login?error=auth_failed&msg=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
