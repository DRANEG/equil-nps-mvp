import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/current-user";
import { summarize, categoryOf, CATEGORY_LABEL } from "@/lib/nps";

function NpsBig({ nps }: { nps: number | null }) {
  if (nps === null) return <span className="font-display text-5xl font-semibold text-ink-faint">—</span>;
  const tone = nps >= 50 ? "text-emerald-deep" : nps >= 0 ? "text-gold" : "text-red-700";
  return (
    <span className={`font-display text-5xl font-semibold tabular-nums ${tone}`}>
      {nps > 0 ? "+" : ""}{nps}
    </span>
  );
}

export default async function Dashboard() {
  const { company } = await requireCompany();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  const [locations, responses, openTasks] = await Promise.all([
    db.location.findMany({
      where: { companyId: company.id },
      include: { responses: { where: { createdAt: { gte: since } }, select: { score: true } } },
      orderBy: { name: "asc" },
    }),
    db.response.findMany({
      where: { location: { companyId: company.id } },
      include: { location: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.task.count({ where: { companyId: company.id, status: { not: "DONE" } } }),
  ]);

  const all = summarize(locations.flatMap((l) => l.responses.map((r) => r.score)));

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-2">Ultimele 30 de zile</p>
        <h1 className="text-3xl font-semibold">Panou</h1>
      </div>

      {/* Indicatorii principali */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="eyebrow mb-3">NPS general</p>
          <NpsBig nps={all.nps} />
          <p className="mt-2 text-sm text-ink-soft">{all.total} răspunsuri</p>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Promotori</p>
          <p className="font-display text-4xl font-semibold tabular-nums text-emerald-deep">{all.promoters}</p>
          <p className="mt-2 text-sm text-ink-soft">au dat 9 sau 10</p>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Detractori</p>
          <p className="font-display text-4xl font-semibold tabular-nums text-red-700">{all.detractors}</p>
          <p className="mt-2 text-sm text-ink-soft">au dat 0–6</p>
        </div>
        <div className="card">
          <p className="eyebrow mb-3">Acțiuni deschise</p>
          <p className="font-display text-4xl font-semibold tabular-nums">{openTasks}</p>
          <Link href="/app/actiuni" className="mt-2 inline-block text-sm font-semibold text-emerald-deep hover:underline">
            Vezi acțiunile →
          </Link>
        </div>
      </section>

      {/* Pe locatii */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Pe locații</h2>
          <Link href="/app/locatii" className="text-sm font-semibold text-emerald-deep hover:underline">Gestionează →</Link>
        </div>
        {locations.length === 0 ? (
          <div className="card text-center">
            <p className="text-ink-soft">Nu aveți încă nicio locație.</p>
            <Link href="/app/locatii" className="btn-primary mt-4">Adaugă prima locație</Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-white">
            <table className="w-full text-sm">
              <thead className="bg-sand text-left text-xs uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-5 py-3 font-semibold">Locație</th>
                  <th className="px-5 py-3 font-semibold">NPS</th>
                  <th className="px-5 py-3 font-semibold">Răspunsuri</th>
                  <th className="px-5 py-3 font-semibold">Detractori</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((l) => {
                  const s = summarize(l.responses.map((r) => r.score));
                  return (
                    <tr key={l.id} className="border-t border-line-soft">
                      <td className="px-5 py-3">
                        <Link href={`/app/locatii/${l.id}`} className="font-semibold hover:text-emerald-deep">{l.name}</Link>
                        {l.city && <span className="ml-2 text-ink-faint">{l.city}</span>}
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums">
                        {s.nps === null ? <span className="text-ink-faint">—</span> : `${s.nps > 0 ? "+" : ""}${s.nps}`}
                      </td>
                      <td className="px-5 py-3 tabular-nums">{s.total}</td>
                      <td className="px-5 py-3 tabular-nums">{s.detractors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ultimele raspunsuri */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Ultimele răspunsuri</h2>
        {responses.length === 0 ? (
          <p className="text-ink-soft">Încă nimic. Trimiteți linkul unei locații sau afișați codul QR.</p>
        ) : (
          <ul className="space-y-2">
            {responses.map((r) => {
              const c = categoryOf(r.score);
              const pill = c === "PROMOTER" ? "bg-emerald/10 text-emerald-deep" : c === "PASSIVE" ? "bg-gold/15 text-gold" : "bg-red-100 text-red-800";
              return (
                <li key={r.id} className="card flex items-start gap-4 !p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold tabular-nums ${pill}`}>
                    {r.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-faint">
                      {r.location.name} · {CATEGORY_LABEL[c]} · {r.createdAt.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                    <p className="mt-0.5 text-sm">{r.comment ?? <span className="text-ink-faint">fără comentariu</span>}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
