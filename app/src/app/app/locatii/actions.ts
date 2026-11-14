"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/current-user";
import { publicToken } from "@/lib/tokens";

export type LocationFormState = { error?: string } | undefined;

const LocationSchema = z.object({
  name: z.string().trim().min(2, "Numele locației e obligatoriu."),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
});

export async function createLocation(_prev: LocationFormState, formData: FormData): Promise<LocationFormState> {
  const { company, role } = await requireCompany();
  if (role === "MANAGER") return { error: "Doar administratorii pot adăuga locații." };

  const parsed = LocationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, address, city } = parsed.data;
  const loc = await db.location.create({
    data: { companyId: company.id, name, address: address || null, city: city || null, publicToken: publicToken() },
  });
  revalidatePath("/app");
  revalidatePath("/app/locatii");
  redirect(`/app/locatii/${loc.id}`);
}

export async function updateLocation(id: string, _prev: LocationFormState, formData: FormData): Promise<LocationFormState> {
  const { company, role } = await requireCompany();
  if (role === "MANAGER") return { error: "Doar administratorii pot modifica locații." };

  const parsed = LocationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, address, city } = parsed.data;
  // companyId in filtru: nimeni nu editeaza locatia altei firme
  await db.location.updateMany({
    where: { id, companyId: company.id },
    data: { name, address: address || null, city: city || null },
  });
  revalidatePath("/app");
  revalidatePath(`/app/locatii/${id}`);
  return undefined;
}

export async function toggleLocation(id: string) {
  const { company, role } = await requireCompany();
  if (role === "MANAGER") return;
  const loc = await db.location.findFirst({ where: { id, companyId: company.id } });
  if (!loc) return;
  await db.location.update({ where: { id }, data: { isActive: !loc.isActive } });
  revalidatePath("/app/locatii");
  revalidatePath(`/app/locatii/${id}`);
}

export async function setLocationManager(id: string, formData: FormData) {
  const { company, role } = await requireCompany();
  if (role === "MANAGER") return;
  const userId = String(formData.get("userId") ?? "");

  const loc = await db.location.findFirst({ where: { id, companyId: company.id } });
  if (!loc) return;

  // Managerul trebuie sa fie membru al firmei
  if (userId) {
    const member = await db.membership.findUnique({ where: { userId_companyId: { userId, companyId: company.id } } });
    if (!member) return;
  }

  await db.$transaction([
    db.locationManager.deleteMany({ where: { locationId: id } }),
    ...(userId ? [db.locationManager.create({ data: { locationId: id, userId } })] : []),
  ]);
  revalidatePath(`/app/locatii/${id}`);
}
