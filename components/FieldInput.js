import { FIELD_TYPES } from "@/lib/constants";
import { FIELD_KEYS, fieldInputName } from "@/lib/fields";

const inputClass = "rounded-md border border-line-2 bg-card px-3 py-2";

/// Bouwt één invoerveld op uit één velddefinitie. Het type in de definitie
/// bepaalt welk soort invoerveld je krijgt. Een nieuw veldtype is dus één
/// case erbij, geen nieuw formulier.
export default function FieldInput({ field, value }) {
  const name = fieldInputName(field[FIELD_KEYS.NAME]);
  const required = field[FIELD_KEYS.REQUIRED];

  switch (field[FIELD_KEYS.TYPE]) {
    case FIELD_TYPES.LONG_TEXT:
      return (
        <textarea
          name={name}
          rows={4}
          required={required}
          defaultValue={value ?? ""}
          className={inputClass}
        />
      );

    case FIELD_TYPES.NUMBER:
      return (
        <input
          name={name}
          type="number"
          step="any"
          required={required}
          defaultValue={value ?? ""}
          className={inputClass}
        />
      );

    case FIELD_TYPES.DATE:
      return (
        <input
          name={name}
          type="date"
          required={required}
          defaultValue={value ?? ""}
          className={inputClass}
        />
      );

    case FIELD_TYPES.SELECT:
      return (
        <select name={name} required={required} defaultValue={value ?? ""} className={inputClass}>
          <option value="">Kies…</option>
          {(field[FIELD_KEYS.OPTIONS] ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case FIELD_TYPES.BOOLEAN:
      return (
        <input
          name={name}
          type="checkbox"
          defaultChecked={Boolean(value)}
          className="size-5 self-start"
        />
      );

    default:
      return (
        <input
          name={name}
          type="text"
          required={required}
          defaultValue={value ?? ""}
          className={inputClass}
        />
      );
  }
}