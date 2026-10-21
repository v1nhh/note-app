"use client";

import { useActionState } from "react";
import { AUTH_FORM } from "@/lib/constants";

/// Client component, want hij houdt bij of het formulier verstuurd wordt en
/// toont de foutmelding die de server action teruggeeft.
export default function AuthForm({ action, submitLabel, newPassword = false }) {
  // useActionState koppelt een server action aan een stukje state: de waarde
  // die de action teruggeeft. state.error is dus wat de server zei.
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    email: "",
  });

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <input
        type="email"
        name={AUTH_FORM.EMAIL}
        defaultValue={state?.email ?? ""}
        placeholder="E-mailadres"
        autoComplete="email"
        required
        className="rounded-md border border-neutral-300 bg-white px-3 py-2"
      />
      <input
        type="password"
        name={AUTH_FORM.PASSWORD}
        placeholder="Wachtwoord"
        autoComplete={newPassword ? "new-password" : "current-password"}
        required
        className="rounded-md border border-neutral-300 bg-white px-3 py-2"
      />

      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white disabled:opacity-60"
      >
        {isPending ? "Bezig…" : submitLabel}
      </button>
    </form>
  );
}