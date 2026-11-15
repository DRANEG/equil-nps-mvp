"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type FormState } from "@/app/(auth)/actions";

function Field(props: {
  label: string; name: string; type?: string; placeholder?: string; defaultValue?: string; autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{props.label}</span>
      <input
        className="field"
        name={props.name}
        type={props.type ?? "text"}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        autoComplete={props.autoComplete}
        required
      />
    </label>
  );
}

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
      {message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorBox message={state?.error} />
      <Field label="E-mail" name="email" type="email" placeholder="nume@firma.ro" defaultValue={state?.fields?.email} autoComplete="email" />
      <Field label="Parolă" name="password" type="password" placeholder="••••••••" autoComplete="current-password" />
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "Se verifică…" : "Intră în cont"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        Nu aveți cont? <Link href="/inregistrare" className="font-semibold text-emerald-deep hover:underline">Creați unul</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(register, undefined);
  const f = state?.fields ?? {};
  return (
    <form action={action} className="space-y-4">
      <ErrorBox message={state?.error} />
      <Field label="Numele dumneavoastră" name="name" placeholder="Maria Ionescu" defaultValue={f.name} autoComplete="name" />
      <Field label="Firma" name="company" placeholder="Restaurantele Aroma SRL" defaultValue={f.company} autoComplete="organization" />
      <Field label="E-mail de serviciu" name="email" type="email" placeholder="nume@firma.ro" defaultValue={f.email} autoComplete="email" />
      <Field label="Parolă (minimum 8 caractere)" name="password" type="password" placeholder="••••••••" autoComplete="new-password" />
      <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60">
        {pending ? "Se creează contul…" : "Creează contul"}
      </button>
      <p className="text-center text-sm text-ink-soft">
        Aveți deja cont? <Link href="/autentificare" className="font-semibold text-emerald-deep hover:underline">Autentificați-vă</Link>
      </p>
    </form>
  );
}
