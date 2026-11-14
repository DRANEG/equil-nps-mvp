import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/current-user";
import { summarize, categoryOf, CATEGORY_LABEL } from "@/lib/nps";
import { EditLocationForm } from "@/components/location-forms";
import { setLocationManager, toggleLocation } from "../actions";

export default async function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { company, role } = await requireCompany();

  const loc = await db.location.findFirst({
    where: { id, companyId: company.id },
    include: {
      managers: { include: { user: { select: { id: true, name: true } } } },
      responses: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!loc) notFound();

  const members = await db.membership.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const publicUrl = `${base}/f/${loc.publicToken}`;
  const stats = summarize(loc.responses.map((r) => r.score));
  const currentManagerId = loc.managers[0]?.user.id ?? "";
  const canEdit = role !== "MANAGER";

  return (
    <div className="space-y-10">
      <div>
        <Link href="/app/locatii" className="text-sm font-semibold text-emerald-deep hover:underline">← Toate locațiile</Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{loc.name}</h1>
            <p className="mt-1 text-ink-soft">{[loc.address, loc.city].filter(Boolean).join(", ") || "fără adresă"}</p>
          </div>
          {canEdit && (
            <form action={toggleLocation.bind(null, loc.id)}>
              <button type="submit" className="btn-line text-xs">{loc.isActive ? "Dezactivează" : "Reactivează"}</button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Linkul public si QR */}
        <section className="card border-emerald/30 bg-emerald/5">
          <p className="eyebrow mb-2 text-emerald-deep">Cum colectezi feedback aici</p>
          <h2 className="text-xl font-semibold">Linkul acestei locații</h2>
          <p className="mt-1 text-sm text-ink-soft">Lipește-l într-un mesaj, pe bon, sau tipărește codul QR la casă.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm">{publicUrl}</code>
            <a href={`/f/${loc.publicToken}`} target="_blank" rel="noopener" className="btn-primary text-xs">Deschide chestionarul ↗</a>
          </div>
          <div className="mt-5 flex items-center gap-5">
            {/* QR generat de un serviciu public — se inlocuieste cu generare locala inainte de lansare */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=8&data=${encodeURIComponent(publicUrl)}`}
              alt={`Cod QR pentru ${loc.name}`}
              width={160} height={160}
              className="rounded-xl border border-line bg-white"
            />
            <div className="text-sm text-ink-soft">
              <p className="font-semibold text-ink">Cod QR</p>
              <p className="mt-1">Clic dreapta → salvează imaginea. Tipărește-o la A6 și pune-o unde clientul pleacă mulțumit sau nu.</p>
            </div>
          </div>
        </section>

        {/* Statistici */}
        <section className="card">
          <p className="eyebrow mb-2">Ultimele {loc.responses.length} răspunsuri</p>
          <div className="flex items-baseline gap-3">
            <span className="font-display text-5xl font-semibold tabular-nums">
              {stats.nps === null ? "—" : `${stats.nps > 0 ? "+" : ""}${stats.nps}`}
            </span>
            <span className="text-sm text-ink-faint">NPS</span>
          </div>
          <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-emerald/10 p-3"><dt className="text-xs text-emerald-deep">Promotori</dt><dd className="font-display text-2xl font-semibold tabular-nums">{stats.promoters}</dd></div>
            <div className="rounded-lg bg-gold/10 p-3"><dt className="text-xs text-gold">Pasivi</dt><dd className="font-display text-2xl font-semibold tabular-nums">{stats.passives}</dd></div>
            <div className="rounded-lg bg-red-50 p-3"><dt className="text-xs text-red-700">Detractori</dt><dd className="font-display text-2xl font-semibold tabular-nums">{stats.detractors}</dd></div>
          </dl>
        </section>
      </div>

      {canEdit && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card">
            <h2 className="mb-4 text-xl font-semibold">Detalii</h2>
            <EditLocationForm id={loc.id} defaults={{ name: loc.name, address: loc.address, city: loc.city }} />
          </section>

          <section className="card">
            <h2 className="text-xl font-semibold">Responsabilul locației</h2>
            <p className="mb-4 mt-1 text-sm text-ink-soft">
              {company.serviceMode === "MANAGED"
                ? "În modul gestionat, EQUIL analizează fiecare detractor și îi propune responsabilului acțiunea."
                : "Primește automat o acțiune pentru fiecare detractor (notă 0–6)."}
            </p>
            <form action={setLocationManager.bind(null, loc.id)} className="flex flex-wrap items-center gap-3">
              <select name="userId" defaultValue={currentManagerId} className="field max-w-xs">
                <option value="">— neatribuit —</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>{m.user.name} ({m.user.email})</option>
                ))}
              </select>
              <button type="submit" className="btn-dark text-xs">Atribuie</button>
            </form>
            <p className="mt-3 text-xs text-ink-faint">Invitarea colegilor în cont vine în etapa următoare.</p>
          </section>
        </div>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Răspunsuri recente</h2>
        {loc.responses.length === 0 ? (
          <p className="text-ink-soft">Niciun răspuns încă. Deschide chestionarul de mai sus și testează-l chiar tu.</p>
        ) : (
          <ul className="space-y-2">
            {loc.responses.map((r) => {
              const c = categoryOf(r.score);
              const pill = c === "PROMOTER" ? "bg-emerald/10 text-emerald-deep" : c === "PASSIVE" ? "bg-gold/15 text-gold" : "bg-red-100 text-red-800";
              return (
                <li key={r.id} className="card flex items-start gap-4 !p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold tabular-nums ${pill}`}>{r.score}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-faint">
                      {CATEGORY_LABEL[c]} · {r.channel} · {r.createdAt.toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}
                      {r.contact && <> · <span className="text-ink">{r.contact}</span></>}
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
