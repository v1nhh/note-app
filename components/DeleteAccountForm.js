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
        className="self-start btn btn-danger"
      >
        Account wissen…
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-danger-line bg-danger-soft p-4"
    >
      <p className="text-sm text-danger">
        Dit wist je account en alles wat erin staat: {summary}. Dit kun je niet
        ongedaan maken.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-danger">Vul je wachtwoord in om te bevestigen</span>
        <input
          type="password"
          name={ACCOUNT_FORM.PASSWORD}
          autoComplete="current-password"
          required
          autoFocus
          className="field field-danger"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-danger-solid disabled:opacity-60"
        >
          {isPending ? "Bezig met wissen…" : "Alles definitief wissen"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn"
        >
          Annuleren
        </button>
      </div>
    </form>
  );
}