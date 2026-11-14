import Link from "next/link";
import { db } from "@/lib/db";
import { requireCompany } from "@/lib/current-user";

export const metadata = { title: "Acțiuni" };

const STATUS_LABEL = { OPEN: "Deschisă", IN_PROGRESS: "În lucru", DONE: "Rezolvată" } as const;
const SOURCE_LABEL = { AUTO_DETRACTOR: "detractor", EQUIL_RECOMMENDATION: "propusă de EQUIL", MANUAL: "manuală" } as const;

export default async function TasksPage() {
  const { company } = await requireCompany();
  const tasks = await db.task.findMany({
    where: { companyId: company.id },
    include: {
      location: { select: { id: true, name: true } },
      assignee: { select: { name: true } },
      response: { select: { score: true, comment: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  const open = tasks.filter((t) => t.status !== "DONE");
  const done = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-10">
      <div>
        <p className="eyebrow mb-2">Închiderea buclei</p>
        <h1 className="text-3xl font-semibold">Acțiuni</h1>
        <p className="mt-2 max-w-xl text-ink-soft">
          Fiecare notă de 0–6 devine automat o acțiune. {company.serviceMode === "MANAGED"
            ? "EQUIL o analizează și propune ce e de făcut; dumneavoastră o puneți în practică."
            : "Responsabilul locației o preia, o rezolvă și notează ce s-a schimbat."}
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="card text-center">
          <p className="text-ink-soft">Nicio acțiune încă — e semn bun, sau nu ați început să colectați.</p>
          <Link href="/app/locatii" className="btn-line mt-4">Vezi locațiile</Link>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-4 text-xl font-semibold">De rezolvat <span className="text-ink-faint">({open.length})</span></h2>
            <TaskList tasks={open} />
          </section>
          {done.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Rezolvate <span className="text-ink-faint">({done.length})</span></h2>
              <TaskList tasks={done} />
            </section>
          )}
        </>
      )}
      <p className="text-xs text-ink-faint">Preluarea, rezolvarea și notarea efectului vin în Etapa 3.</p>
    </div>
  );
}

type T = Awaited<ReturnType<typeof db.task.findMany<{ include: { location: { select: { id: true; name: true } }; assignee: { select: { name: true } }; response: { select: { score: true; comment: true } } } }>>>[number];

function TaskList({ tasks }: { tasks: T[] }) {
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="card !p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{t.title}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {t.location ? <Link href={`/app/locatii/${t.location.id}`} className="hover:underline">{t.location.name}</Link> : "fără locație"}
                {" · "}{SOURCE_LABEL[t.source]}
                {" · "}{t.createdAt.toLocaleDateString("ro-RO")}
                {" · "}{t.assignee ? `responsabil: ${t.assignee.name}` : <span className="text-gold">neatribuită</span>}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === "DONE" ? "bg-emerald/10 text-emerald-deep" : t.status === "IN_PROGRESS" ? "bg-gold/15 text-gold" : "bg-red-100 text-red-800"}`}>
              {STATUS_LABEL[t.status]}
            </span>
          </div>
          {t.response?.comment && <p className="mt-3 border-l-2 border-line pl-3 text-sm italic text-ink-soft">„{t.response.comment}"</p>}
          {t.recommendation && <p className="mt-3 rounded-lg bg-emerald/5 p-3 text-sm"><span className="font-semibold text-emerald-deep">Propunere EQUIL: </span>{t.recommendation}</p>}
          {t.outcome && <p className="mt-2 text-sm"><span className="font-semibold">Rezultat: </span>{t.outcome}</p>}
        </li>
      ))}
    </ul>
  );
}
