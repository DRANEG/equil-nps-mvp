"use client";

import { useActionState } from "react";
import { createLocation, updateLocation, type LocationFormState } from "@/app/app/locatii/actions";

function Fields({ defaults }: { defaults?: { name?: string; address?: string | null; city?: string | null } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-sm font-semibold">Numele locației</span>
        <input name="name" className="field" placeholder="Restaurantul din Centru" defaultValue={defaults?.name} required />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Adresa <span className="font-normal text-ink-faint">(opțional)</span></span>
        <input name="address" className="field" placeholder="Str. Lipscani 12" defaultValue={defaults?.address ?? ""} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">Orașul <span className="font-normal text-ink-faint">(opțional)</span></span>
        <input name="city" className="field" placeholder="București" defaultValue={defaults?.city ?? ""} />
      </label>
    </div>
  );
}

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">{message}</p>;
}

export function CreateLocationForm() {
  const [state, action, pending] = useActionState<LocationFormState, FormData>(createLocation, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorBox message={state?.error} />
      <Fields />
      <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
        {pending ? "Se adaugă…" : "Adaugă locația"}
      </button>
    </form>
  );
}

export function EditLocationForm({ id, defaults }: { id: string; defaults: { name: string; address: string | null; city: string | null } }) {
  const bound = updateLocation.bind(null, id);
  const [state, action, pending] = useActionState<LocationFormState, FormData>(bound, undefined);
  return (
    <form action={action} className="space-y-4">
      <ErrorBox message={state?.error} />
      <Fields defaults={defaults} />
      <button type="submit" disabled={pending} className="btn-dark disabled:opacity-60">
        {pending ? "Se salvează…" : "Salvează"}
      </button>
    </form>
  );
}
