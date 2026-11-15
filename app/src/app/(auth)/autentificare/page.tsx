import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Autentificare" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <AuthShell title="Bine ați revenit" subtitle="Intrați în contul firmei dumneavoastră.">
      <LoginForm />
    </AuthShell>
  );
}
