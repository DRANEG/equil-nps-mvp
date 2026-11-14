"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { categoryOf } from "@/lib/nps";

export type SurveyState = { ok?: true; error?: string } | undefined;

const Schema = z.object({
  token: z.string().min(4).max(32),
  score: z.coerce.number().int().min(0).max(10),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
  contact: z.string().trim().max(120).optional().or(z.literal("")),
  channel: z.enum(["QR", "LINK", "EMAIL"]).default("LINK"),
});

export async function submitResponse(_prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const parsed = Schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Alegeți o notă de la 0 la 10." };
  const { token, score, comment, contact, channel } = parsed.data;

  const location = await db.location.findUnique({
    where: { publicToken: token },
    include: {
      company: { include: { surveys: { where: { isDefault: true, isActive: true }, take: 1 } } },
      managers: { take: 1 },
    },
  });
  if (!location || !location.isActive) return { error: "Acest chestionar nu mai este activ." };
  const survey = location.company.surveys[0];
  if (!survey) return { error: "Chestionarul nu este configurat." };

  const isDetractor = categoryOf(score) === "DETRACTOR";
  const managed = location.company.serviceMode === "MANAGED";

  // Raspunsul si, pentru detractori, actiunea — intr-o singura tranzactie.
  // SELF_SERVE: merge direct la managerul locatiei. MANAGED: ramane neatribuita, EQUIL o analizeaza intai.
  await db.response.create({
    data: {
      locationId: location.id,
      surveyId: survey.id,
      score,
      comment: comment || null,
      contact: contact || null,
      channel,
      ...(isDetractor && {
        task: {
          create: {
            companyId: location.companyId,
            locationId: location.id,
            source: "AUTO_DETRACTOR",
            title: `Client nemulțumit (nota ${score}) — ${location.name}`,
            description: comment || null,
            assigneeId: managed ? null : (location.managers[0]?.userId ?? null),
          },
        },
      }),
    },
  });

  return { ok: true };
}
