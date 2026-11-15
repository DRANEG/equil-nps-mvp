import Link from "next/link";
import { Logo } from "./logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panoul de brand — vizibil doar pe ecrane mari */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-forest p-12 text-ivory lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <Logo size={32} dark />
          <span className="font-display text-xl font-bold">EQUIL</span>
        </Link>
        <div className="max-w-md">
          <p className="eyebrow mb-5 text-emerald-bright/80">Feedback care devine acțiune</p>
          <h2 className="text-4xl font-semibold leading-tight">
            Un scor e o cifră.<br />O sarcină pentru cineva anume e o schimbare.
          </h2>
          <p className="mt-5 text-ivory/70">
            Fiecare client nemulțumit ajunge la managerul locației, cu context, în aceeași oră — nu într-un raport trimestrial.
          </p>
        </div>
        <p className="text-sm text-ivory/45">© {new Date().getFullYear()} EQUIL</p>
        <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-emerald/20 blur-3xl" />
      </aside>

      <section className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={28} />
            <span className="font-display text-lg font-bold">EQUIL</span>
          </div>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mb-8 mt-2 text-ink-soft">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
