"use client";

import { useActionState, useState } from "react";
import { deleteAccount } from "@/app/account-actions";
import { ACCOUNT_FORM } from "@/lib/constants";

/// Account wissen in twee stappen. Eerst een knop die alleen het formulier
/// openklapt; pas met je wachtwoord erbij wordt er echt iets gewist. Zo kun
/// je niet per ongeluk alles kwijtraken met één klik.
export default function DeleteAccountForm({ summary }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(deleteAccount, { error: null });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
      >
        Account wissen…
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-red-200 bg-red-50 p-4"
    >
      <p className="text-sm text-red-900">
        Dit wist je account en alles wat erin staat: {summary}. Dit kun je niet
        ongedaan maken.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-red-900">Vul je wachtwoord in om te bevestigen</span>
        <input
          type="password"
          name={ACCOUNT_FORM.PASSWORD}
          autoComplete="current-password"
          required
          autoFocus
          className="rounded-md border border-red-300 bg-white px-3 py-2"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? "Bezig met wissen…" : "Alles definitief wissen"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm hover:border-neutral-500"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}