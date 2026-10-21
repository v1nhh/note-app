"use client";

import { useActionState, useState } from "react";
import { FIELD_TYPES, FIELD_TYPE_LABELS, TYPE_FORM } from "@/lib/constants";
import { FIELD_KEYS } from "@/lib/fields";

/// Elke rij krijgt een eigen key. Die mag niet de index zijn: verwijder je rij
/// 1, dan schuift alles op en hergebruikt React de verkeerde invoervelden.
let nextRowId = 0;
function emptyRow() {
  nextRowId += 1;
  return {
    rowId: nextRowId,
    [FIELD_KEYS.NAME]: "",
    [FIELD_KEYS.TYPE]: FIELD_TYPES.TEXT,
    [FIELD_KEYS.REQUIRED]: false,
    // In het invoerveld tekst met komma's; de server maakt er een lijst van.
    [FIELD_KEYS.OPTIONS]: "",
  };
}

const inputClass = "rounded-md border border-neutral-300 bg-white px-3 py-2";

export default function ItemTypeForm({ action }) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    name: "",
    icon: "",
  });

  // De veldrijen zijn state in de browser: erbij en eraf zonder de server.
  const [rows, setRows] = useState(() => [emptyRow()]);

  function updateRow(rowId, key, value) {
    setRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)),
    );
  }

  function removeRow(rowId) {
    setRows((current) => current.filter((row) => row.rowId !== rowId));
  }

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name={TYPE_FORM.NAME}
          defaultValue={state?.name ?? ""}
          placeholder="Naam, bijvoorbeeld: persoon"
          aria-label="Naam van de soort"
          required
          className={`${inputClass} flex-1`}
        />
        <input
          name={TYPE_FORM.ICON}
          defaultValue={state?.icon ?? ""}
          placeholder="Icoon (emoji)"
          aria-label="Icoon, optioneel"
          maxLength={4}
          className={`${inputClass} sm:w-36`}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="font-semibold">Velden</legend>
        <p className="text-sm text-neutral-500">
          Welke gegevens wil je bij elk item van deze soort bijhouden? Een soort
          zonder velden mag ook.
        </p>

        {rows.map((row, index) => (
          <div
            key={row.rowId}
            className="flex flex-col gap-2 rounded-md border border-neutral-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <input
              name={TYPE_FORM.FIELD_NAME}
              value={row[FIELD_KEYS.NAME]}
              onChange={(event) => updateRow(row.rowId, FIELD_KEYS.NAME, event.target.value)}
              placeholder="Veldnaam, bijvoorbeeld: verjaardag"
              aria-label={`Naam van veld ${index + 1}`}
              className={`${inputClass} sm:flex-1`}
            />

            <select
              name={TYPE_FORM.FIELD_TYPE}
              value={row[FIELD_KEYS.TYPE]}
              onChange={(event) => updateRow(row.rowId, FIELD_KEYS.TYPE, event.target.value)}
              aria-label={`Type van veld ${index + 1}`}
              className={inputClass}
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Een select en geen checkbox: een uitgevinkte checkbox stuurt
                niets mee, waardoor de lijsten niet meer gelijk lopen. */}
            <select
              name={TYPE_FORM.FIELD_REQUIRED}
              value={String(row[FIELD_KEYS.REQUIRED])}
              onChange={(event) =>
                updateRow(row.rowId, FIELD_KEYS.REQUIRED, event.target.value === "true")
              }
              aria-label={`Is veld ${index + 1} verplicht?`}
              className={inputClass}
            >
              <option value="false">Optioneel</option>
              <option value="true">Verplicht</option>
            </select>

            <button
              type="button"
              onClick={() => removeRow(row.rowId)}
              aria-label={`Veld ${index + 1} weghalen`}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:border-neutral-500"
            >
              Weg
            </button>

            {/* Altijd meesturen, ook als het geen keuzelijst is: anders lopen
                de lijsten uit de pas. Alleen zichtbaar bij een keuzelijst. */}
            <input
              type={row[FIELD_KEYS.TYPE] === FIELD_TYPES.SELECT ? "text" : "hidden"}
              name={TYPE_FORM.FIELD_OPTIONS}
              value={row[FIELD_KEYS.OPTIONS]}
              onChange={(event) => updateRow(row.rowId, FIELD_KEYS.OPTIONS, event.target.value)}
              placeholder="Keuzes, gescheiden door komma's: gelezen, wil ik lezen"
              aria-label={`Keuzes voor veld ${index + 1}`}
              className={`${inputClass} sm:basis-full`}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => setRows((current) => [...current, emptyRow()])}
          className="self-start rounded-md border border-neutral-300 px-3 py-2 text-sm hover:border-neutral-500"
        >
          + Veld toevoegen
        </button>
      </fieldset>

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
        {isPending ? "Bezig…" : "Soort bewaren"}
      </button>
    </form>
  );
}