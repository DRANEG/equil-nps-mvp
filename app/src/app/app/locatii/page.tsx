import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/current-user";
import { CreateLocationForm } from "@/components/location-forms";

export const metadata = { title: "Locații" };

export default async function LocationsPage() {
  const { company, role } = await requireCompany();
  const locations = await db.location.findMany({
    where: { companyId: company.id },
    include: { _count: { select: { responses: true } }, managers: { include: { user: { select: { name: true } } } } },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-2">{company.name}</p>
        <h1 className="text-3xl font-semibold">Locații</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Fiecare locație primește propriul link și cod QR. Clienții răspund de pe telefon, în 20 de secunde.
        </p>
      </div>

      {locations.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {locations.map((l) => (
            <li key={l.id}>
              <Link href={`/app/locatii/${l.id}`} className={`card block transition hover:shadow-card ${l.isActive ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{l.name}</h2>
                    <p className="text-sm text-ink-faint">{[l.address, l.city].filter(Boolean).join(", ") || "fără adresă"}</p>
                  </div>
                  {!l.isActive && <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-ink-soft">inactivă</span>}
                </div>
                <dl className="mt-4 flex gap-6 text-sm">
                  <div><dt className="text-ink-faint">Răspunsuri</dt><dd className="font-semibold tabular-nums">{l._count.responses}</dd></div>
                  <div><dt className="text-ink-faint">Responsabil</dt><dd className="font-semibold">{l.managers[0]?.user.name ?? <span className="font-normal text-ink-faint">neatribuit</span>}</dd></div>
                  <div><dt className="text-ink-faint">Cod</dt><dd className="font-mono font-semibold">{l.publicToken}</dd></div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {role !== "MANAGER" && (
        <section className="card max-w-2xl">
          <h2 className="mb-1 text-xl font-semibold">{locations.length === 0 ? "Adaugă prima locație" : "Adaugă o locație"}</h2>
          <p className="mb-5 text-sm text-ink-soft">Un restaurant, o clinică, un magazin — orice punct unde clienții au o experiență de evaluat.</p>
          <CreateLocationForm />
        </section>
      )}
    </div>
  );
}
