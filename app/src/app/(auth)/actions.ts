"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, clearSession, hashPassword, verifyPassword } from "@/lib/auth";
import { companySlug } from "@/lib/tokens";

export type FormState = { error?: string; fields?: Record<string, string> } | undefined;

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Spuneți-ne cum vă numiți."),
  company: z.string().trim().min(2, "Numele firmei e obligatoriu."),
  email: z.string().trim().toLowerCase().email("Adresa de e-mail nu pare validă."),
  password: z.string().min(8, "Parola trebuie să aibă cel puțin 8 caractere."),
});

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: raw };
  }
  const { name, company, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Există deja un cont cu această adresă. Autentificați-vă.", fields: raw };
  }

  const passwordHash = await hashPassword(password);

  // Un cont nou = utilizator + firma + rol de proprietar + chestionarul implicit, atomic.
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: {
          role: "OWNER",
          company: {
            create: {
              name: company,
              slug: companySlug(company),
              surveys: { create: { name: "Chestionar standard", isDefault: true } },
            },
          },
        },
      },
    },
  });

  await createSession(user.id);
  redirect("/app");
}

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresa de e-mail nu pare validă."),
  password: z.string().min(1, "Introduceți parola."),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: { email: raw.email ?? "" } };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  // Acelasi mesaj indiferent de cauza: nu confirmam daca adresa exista.
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return { error: "Adresa sau parola nu sunt corecte.", fields: { email } };
  }

  await createSession(user.id);
  redirect("/app");
}

export async function logout() {
  await clearSession();
  redirect("/autentificare");
}
