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
        className="field"
      />
      <input
        type="password"
        name={AUTH_FORM.PASSWORD}
        placeholder="Wachtwoord"
        autoComplete={newPassword ? "new-password" : "current-password"}
        required
        className="field"
      />

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start btn btn-solid disabled:opacity-60"
      >
        {isPending ? "Bezig…" : submitLabel}
      </button>
    </form>
  );
}