import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { readSessionUserId } from "./auth";

// Utilizatorul curent + firma in care lucreaza. Memorat per cerere.
export const getCurrentUser = cache(async () => {
  const uid = await readSessionUserId();
  if (!uid) return null;
  return db.user.findUnique({
    where: { id: uid },
    include: {
      memberships: { include: { company: true }, orderBy: { createdAt: "asc" } },
    },
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/autentificare");
  return user;
}

/** Utilizatorul si firma activa. In MVP, un utilizator apartine unei singure firme. */
export async function requireCompany() {
  const user = await requireUser();
  const membership = user.memberships[0];
  if (!membership) redirect("/inregistrare");
  return { user, company: membership.company, role: membership.role };
}
