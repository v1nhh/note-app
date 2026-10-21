"use client";

import { useActionState } from "react";
import { ITEM_FORM } from "@/lib/constants";
import { FIELD_KEYS } from "@/lib/fields";
import FieldInput from "@/components/FieldInput";
import MentionTextarea from "@/components/MentionTextarea";

const inputClass = "rounded-md border border-line-2 bg-card px-3 py-2";

/// Het formulier voor een item. Titel en tekst zijn vast; de rest komt uit de
/// velddefinities van de soort. Er staat nergens in de code welke velden een
/// "persoon" of een "boek" heeft.
///
/// Zonder item: een nieuw item. Met item ({ id, title, body, values }): het
/// bestaande item bewerken, met alles al ingevuld.
export default function DynamicItemForm({
  action,
  type,
  fields,
  item = null,
  targets = [],
  submitLabel = "Bewaren",
}) {
  // De beginwaarde komt uit het item (bewerken) of is leeg (nieuw). Na een
  // fout geeft de action terug wat er ingevuld was, zodat niets verdwijnt.
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    title: item?.title ?? "",
    body: item?.body ?? "",
    values: item?.values ?? {},
  });

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      {/* De server moet weten onder welke soort het item komt, en bij
          bewerken welk item het is. */}
      <input type="hidden" name={ITEM_FORM.TYPE_ID} value={type.id} />
      {item && <input type="hidden" name={ITEM_FORM.ID} value={item.id} />}

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

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium" id="item-body-label">
          Notitie
        </span>
        {/* Een MentionTextarea houdt zijn eigen tekst vast, ook na een fout. */}
        <MentionTextarea
          name={ITEM_FORM.BODY}
          defaultValue={state.body}
          targets={targets}
          excludeId={item?.id ?? null}
          rows={item ? 8 : 4}
          aria-labelledby="item-body-label"
          placeholder="Typ @ om naar iemand of iets te verwijzen."
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-action px-4 py-2 text-action-text disabled:opacity-60"
      >
        {isPending ? "Bezig…" : submitLabel}
      </button>
    </form>
  );
}