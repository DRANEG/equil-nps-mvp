// Date demonstrative: o firma cu doua locatii si raspunsuri realiste din ultimele 30 de zile.
// Ruleaza cu: npm run db:seed    (idempotent — poate fi rulat de mai multe ori)
import { PrismaClient, Channel } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const COMMENTS: Record<"low" | "mid" | "high", string[]> = {
  low: [
    "Am așteptat 40 de minute până a venit comanda și nimeni nu ne-a spus nimic.",
    "Masa era murdară când ne-am așezat. Am cerut să fie ștearsă.",
    "Prețul de pe bon nu era cel din meniu.",
    "Personalul părea depășit, a trebuit să chemăm de trei ori.",
    null as unknown as string,
  ],
  mid: [
    "Mâncarea bună, dar cam gălăgie.",
    "Ok în general, nimic deosebit.",
    "Servire corectă, desertul a întârziat puțin.",
    null as unknown as string,
  ],
  high: [
    "Excelent, ne întoarcem sigur!",
    "Cea mai bună ciorbă din oraș, iar ospătarul a fost super atent.",
    "Rapid, curat, prietenos. Exact ce trebuie.",
    "Am sărbătorit aici și totul a fost perfect.",
    null as unknown as string,
  ],
};

function pick<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function daysAgo(n: number) { return new Date(Date.now() - n * 24 * 3600 * 1000 - Math.random() * 12 * 3600 * 1000); }

// Distributie realista pentru un restaurant decent: majoritatea 8-10, cativa 4-6
function sampleScore(bias: number) {
  const r = Math.random();
  if (r < 0.12 - bias) return Math.floor(Math.random() * 7);        // 0-6
  if (r < 0.40 - bias) return 7 + Math.floor(Math.random() * 2);    // 7-8
  return 9 + Math.floor(Math.random() * 2);                          // 9-10
}

async function main() {
  const email = "demo@equil.ro";
  const passwordHash = await bcrypt.hash("parola123", 12);

  const owner = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Andrei Popescu", passwordHash },
  });

  const company = await db.company.upsert({
    where: { slug: "aroma-demo" },
    update: {},
    create: {
      name: "Restaurantele Aroma",
      slug: "aroma-demo",
      serviceMode: "SELF_SERVE",
      memberships: { create: { userId: owner.id, role: "OWNER" } },
      surveys: { create: { name: "Chestionar standard", isDefault: true } },
    },
    include: { surveys: true },
  });
  const survey = company.surveys[0];

  const locs = [
    { name: "Aroma Centru", address: "Str. Lipscani 12", city: "București", publicToken: "aromactr", bias: 0 },
    { name: "Aroma Băneasa", address: "Șos. București-Ploiești 42", city: "București", publicToken: "aromaban", bias: -0.08 },
  ];

  for (const l of locs) {
    const loc = await db.location.upsert({
      where: { publicToken: l.publicToken },
      update: {},
      create: { companyId: company.id, name: l.name, address: l.address, city: l.city, publicToken: l.publicToken,
                managers: { create: { userId: owner.id } } },
    });

    const existing = await db.response.count({ where: { locationId: loc.id } });
    if (existing > 0) continue;

    const n = 28 + Math.floor(Math.random() * 12);
    for (let i = 0; i < n; i++) {
      const score = sampleScore(l.bias);
      const bucket = score <= 6 ? "low" : score <= 8 ? "mid" : "high";
      const comment = pick(COMMENTS[bucket]) ?? null;
      await db.response.create({
        data: {
          locationId: loc.id, surveyId: survey.id, score, comment,
          channel: pick([Channel.QR, Channel.QR, Channel.LINK]),
          createdAt: daysAgo(Math.floor(Math.random() * 30)),
          ...(score <= 6 && {
            task: { create: {
              companyId: company.id, locationId: loc.id, source: "AUTO_DETRACTOR",
              title: `Client nemulțumit (nota ${score}) — ${loc.name}`,
              description: comment, assigneeId: owner.id,
              status: Math.random() < 0.4 ? "DONE" : "OPEN",
            } },
          }),
        },
      });
    }
  }

  const stats = await db.response.groupBy({ by: ["locationId"], _count: true });
  console.log(`Cont demo: ${email} / parola123`);
  console.log(`Firma: ${company.name} · ${stats.length} locații · ${stats.reduce((a, s) => a + s._count, 0)} răspunsuri`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
