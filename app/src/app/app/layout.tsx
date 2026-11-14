import Link from "next/link";
import { requireCompany } from "@/lib/current-user";
import { logout } from "@/app/(auth)/actions";
import { Logo } from "@/components/logo";

const NAV = [
  { href: "/app", label: "Panou" },
  { href: "/app/locatii", label: "Locații" },
  { href: "/app/actiuni", label: "Acțiuni" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, company } = await requireCompany();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line-soft bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link href="/app" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="font-display text-lg font-bold">EQUIL</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-sm font-medium text-ink-soft sm:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{company.name}</p>
              <p className="text-xs text-ink-faint">
                {user.name} · {company.serviceMode === "MANAGED" ? "gestionat de EQUIL" : "auto-servire"}
              </p>
            </div>
            <form action={logout}>
              <button type="submit" className="btn-line !px-3.5 !py-1.5 text-xs">Ieșire</button>
            </form>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto border-t border-line-soft px-5 py-2 text-sm font-medium text-ink-soft sm:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap">{n.label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
