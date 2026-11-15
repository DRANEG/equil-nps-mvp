import type { Metadata } from "next";
import { db } from "@/lib/db";
import { SurveyForm } from "@/components/survey-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Părerea dumneavoastră", robots: { index: false } };

export default async function PublicSurvey({
  params, searchParams,
}: { params: Promise<{ token: string }>; searchParams: Promise<{ c?: string }> }) {
  const { token } = await params;
  const { c } = await searchParams;
  const channel = c === "qr" ? "QR" : c === "email" ? "EMAIL" : "LINK";

  const location = await db.location.findUnique({
    where: { publicToken: token },
    include: { company: { include: { surveys: { where: { isDefault: true, isActive: true }, take: 1 } } } },
  });
  const survey = location?.company.surveys[0];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-3xl border border-line bg-white p-7 shadow-card sm:p-10">
          {!location || !location.isActive || !survey ? (
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Acest chestionar nu este disponibil</h1>
              <p className="mt-3 text-ink-soft">Linkul poate fi greșit sau locația nu mai colectează feedback.</p>
            </div>
          ) : (
            <SurveyForm
              token={token}
              channel={channel}
              question={survey.question}
              followUpPrompt={survey.followUpPrompt}
              thankYouMessage={survey.thankYouMessage}
              businessName={location.company.name}
            />
          )}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-faint">
          <Logo size={16} /> Colectat prin EQUIL
        </p>
      </div>
    </main>
  );
}
