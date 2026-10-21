"use client";

import { useActionState, useState } from "react";
import { FIELD_TYPES, FIELD_TYPE_LABELS, TYPE_FORM } from "@/lib/constants";
import { FIELD_KEYS } from "@/lib/fields";

/// Elke rij krijgt een eigen key. Die mag niet de index zijn: verwijder je rij
/// 1, dan schuift alles op en hergebruikt React de verkeerde invoervelden.
let nextRowId = 0;

/// Een rij in het formulier. original is de naam die het veld had toen je het
/// formulier opende; bij een nieuwe rij is die leeg. Zo ziet de server of je
/// een veld hernoemde of een nieuw veld toevoegde.
function makeRow(field = null) {
  nextRowId += 1;
  return {
    rowId: nextRowId,
    original: field?.[FIELD_KEYS.NAME] ?? "",
    [FIELD_KEYS.NAME]: field?.[FIELD_KEYS.NAME] ?? "",
    [FIELD_KEYS.TYPE]: field?.[FIELD_KEYS.TYPE] ?? FIELD_TYPES.TEXT,
    [FIELD_KEYS.REQUIRED]: field?.[FIELD_KEYS.REQUIRED] ?? false,
    // In de database een lijst; in het invoerveld tekst met komma's.
    [FIELD_KEYS.OPTIONS]: (field?.[FIELD_KEYS.OPTIONS] ?? []).join(", "),
  };
}

const inputClass = "field";

/// Hetzelfde formulier voor een nieuwe soort en voor een bestaande. Geef je
/// type en fields mee, dan staat alles al ingevuld en gaat de id mee.
export default function ItemTypeForm({ action, type = null, fields = [] }) {
  const editing = type !== null;

  const [state, formAction, isPending] = useActionState(action, {
    error: null,
    name: type?.name ?? "",
    icon: type?.icon ?? "",
  });

  // De veldrijen zijn state in de browser: erbij en eraf zonder de server.
  const [rows, setRows] = useState(() =>
    fields.length > 0 ? fields.map((field) => makeRow(field)) : [makeRow()],
  );

  function updateRow(rowId, key, value) {
    setRows((current) =>
      current.map((row) => (row.rowId === rowId ? { ...row, [key]: value } : row)),
    );
  }

  function removeRow(rowId) {
    setRows((current) => current.filter((row) => row.rowId !== rowId));
  }

  // Welke bestaande velden zijn weg? Die verliezen hun waarden, en dat mag je
  // weten voordat je bewaart. Zelfde regel als planFieldMigration op de
  // server: een rij houdt een veld vast via zijn oude naam, of anders via zijn
  // huidige naam.
  const kept = new Set(rows.map((row) => row.original || row[FIELD_KEYS.NAME].trim()));
  const dropped = fields
    .map((field) => field[FIELD_KEYS.NAME])
    .filter((name) => !kept.has(name));

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-8">
      {editing && <input type="hidden" name={TYPE_FORM.ID} value={type.id} />}

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
        <p className="text-sm text-ink-3">
          {editing
            ? "Hernoem je een veld, dan verhuizen de ingevulde waarden mee."
            : "Welke gegevens wil je bij elk item van deze soort bijhouden? Een soort zonder velden mag ook."}
        </p>

        {rows.map((row, index) => (
          <div
            key={row.rowId}
            className="flex flex-col gap-2 card card-compact sm:flex-row sm:flex-wrap sm:items-center"
          >
            {/* Altijd meesturen, ook leeg: de lijsten moeten even lang
                blijven, zodat de server ze per rij kan samenvoegen. */}
            <input type="hidden" name={TYPE_FORM.FIELD_ORIGINAL} value={row.original} />

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
              className="btn btn-sm"
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

            {row.original && row.original !== row[FIELD_KEYS.NAME].trim() && (
              <p className="text-xs text-ink-3 sm:basis-full">
                Was: {row.original}. De waarden verhuizen mee.
              </p>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setRows((current) => [...current, makeRow()])}
          className="self-start btn btn-sm"
        >
          + Veld toevoegen
        </button>
      </fieldset>

      {/* Een veld weghalen neemt alles mee wat erin stond. Dat zeg je
          vóór het bewaren, niet erna. */}
      {dropped.length > 0 && (
        <div role="status" className="rounded-md border border-danger-line bg-danger-soft p-3 text-sm text-danger">
          <p className="font-semibold">Deze velden gaan weg, met alles wat erin staat:</p>
          <p className="mt-1">{dropped.join(", ")}</p>
        </div>
      )}

      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`self-start rounded-md px-4 py-2 text-action-text disabled:opacity-60 ${
          dropped.length > 0 ? "bg-danger" : "bg-action"
        }`}
      >
        {isPending
          ? "Bezig…"
          : dropped.length > 0
            ? "Bewaren en velden weghalen"
            : "Soort bewaren"}
      </button>
    </form>
  );
}