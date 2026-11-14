"use client";

import { useActionState, useState } from "react";
import { submitResponse, type SurveyState } from "@/app/f/[token]/actions";

interface Props {
  token: string;
  channel: "QR" | "LINK" | "EMAIL";
  question: string;
  followUpPrompt: string;
  thankYouMessage: string;
  businessName: string;
}

function scoreTone(n: number, active: boolean) {
  if (!active) return "border-line bg-white text-ink hover:border-ink";
  if (n <= 6) return "border-red-600 bg-red-600 text-white";
  if (n <= 8) return "border-gold bg-gold text-white";
  return "border-emerald bg-emerald text-white";
}

export function SurveyForm(p: Props) {
  const [state, action, pending] = useActionState<SurveyState, FormData>(submitResponse, undefined);
  const [score, setScore] = useState<number | null>(null);

  if (state?.ok) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10 text-3xl text-emerald-deep">✓</div>
        <h1 className="text-2xl font-semibold">Mulțumim!</h1>
        <p className="mx-auto mt-3 max-w-sm text-ink-soft">{p.thankYouMessage}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="token" value={p.token} />
      <input type="hidden" name="channel" value={p.channel} />
      {score !== null && <input type="hidden" name="score" value={score} />}

      <div>
        <p className="eyebrow mb-3">{p.businessName}</p>
        <h1 className="text-2xl font-semibold leading-snug sm:text-3xl">{p.question}</h1>
      </div>

      <fieldset>
        <legend className="sr-only">Nota de la 0 la 10</legend>
        {/* Pe telefon: 2 randuri (0-5, 6-10) cu tinte de minimum 48px pentru deget; pe ecran lat: un rand */}
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
          {Array.from({ length: 11 }, (_, n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              aria-pressed={score === n}
              aria-label={`Nota ${n}`}
              className={`h-12 rounded-xl border text-lg font-semibold tabular-nums transition sm:aspect-square sm:h-auto sm:rounded-lg sm:text-base ${scoreTone(n, score === n)}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-ink-faint">
          <span>0 = deloc probabil</span>
          <span>10 = foarte probabil</span>
        </div>
      </fieldset>

      {score !== null && (
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{p.followUpPrompt}</span>
            <textarea name="comment" rows={3} className="field resize-y" placeholder="Opțional, dar ne ajută enorm." />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Telefon sau e-mail <span className="font-normal text-ink-faint">(opțional — doar dacă vreți să vă contactăm)</span>
            </span>
            <input name="contact" className="field" placeholder="07xx xxx xxx" autoComplete="tel" />
          </label>
        </div>
      )}

      {state?.error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{state.error}</p>}

      <button type="submit" disabled={score === null || pending} className="btn-primary w-full !py-3.5 text-base disabled:opacity-50">
        {pending ? "Se trimite…" : score === null ? "Alegeți o notă" : "Trimite"}
      </button>

      <p className="text-center text-xs text-ink-faint">
        Răspunsul este anonim dacă nu lăsați date de contact. Datele sunt prelucrate conform politicii de confidențialitate a {p.businessName}.
      </p>
    </form>
  );
}
