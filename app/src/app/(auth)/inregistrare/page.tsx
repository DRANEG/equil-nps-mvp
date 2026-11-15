import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { RegisterForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Creați un cont" };

export default async function Page() {
  if (await getCurrentUser()) redirect("/app");
  return (
    <AuthShell
      title="Începeți cu prima locație"
      subtitle="Contul e gratuit cât timp testați. Durează un minut."
    >
      <RegisterForm />
    </AuthShell>
  );
}
