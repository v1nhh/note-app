"use client";

import { useActionState } from "react";
import { ITEM_FORM } from "@/lib/constants";
import { FIELD_KEYS } from "@/lib/fields";
import FieldInput from "@/components/FieldInput";

const inputClass = "rounded-md border border-neutral-300 bg-white px-3 py-2";

/// Het formulier voor een item. Titel en tekst zijn vast; de rest komt uit de
/// velddefinities van de soort. Er staat nergens in de code welke velden een
/// "persoon" of een "boek" heeft.
export default function DynamicItemForm({ action, type, fields, submitLabel = "Bewaren" }) {
  // De action geeft bij een fout alles terug wat er ingevuld was, zodat het
  // formulier niet leeg is.
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    title: "",
    body: "",
    values: {},
  });

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      {/* De server moet weten onder welke soort het item komt. */}
      <input type="hidden" name={ITEM_FORM.TYPE_ID} value={type.id} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Titel *</span>
        <input
          name={ITEM_FORM.TITLE}
          defaultValue={state.title}
          required
          className={inputClass}
        />
      </label>

      {/* Hier komen de velden die de gebruiker zelf heeft bedacht. */}
      {fields.map((field) => (
        <label key={field[FIELD_KEYS.NAME]} className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">
            {field[FIELD_KEYS.NAME]}
            {field[FIELD_KEYS.REQUIRED] ? " *" : ""}
          </span>
          <FieldInput field={field} value={state.values[field[FIELD_KEYS.NAME]]} />
        </label>
      ))}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Notitie</span>
        <textarea
          name={ITEM_FORM.BODY}
          rows={4}
          defaultValue={state.body}
          className={inputClass}
        />
      </label>

      {state.error && (
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