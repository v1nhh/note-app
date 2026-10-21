import { FIELD_TYPES } from "@/lib/constants";

// Voorbeeld van een velddefinitie:
//   { name: "verjaardag", type: "date", required: false }
// Een keuzelijst heeft ook options:
//   { name: "status", type: "select", required: true, options: ["gelezen", "wil ik lezen"] }
//
// De sleutels staan op één plek, dan kan ik me niet vertypen.
export const FIELD_KEYS = {
  NAME: "name",
  TYPE: "type",
  REQUIRED: "required",
  OPTIONS: "options",
};

const VALID_TYPES = Object.values(FIELD_TYPES);

const MAX_FIELD_NAME_LENGTH = 40;

// JSON uit de database is gewoon tekst, dus het kan kapot zijn. Deze functie
// geeft altijd een array terug (soms leeg) met alleen geldige velden. De rest
// van de app hoeft dan nergens meer te controleren of een veld klopt.
export function parseFieldDefinitions(raw) {
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(
      (field) =>
        field &&
        typeof field[FIELD_KEYS.NAME] === "string" &&
        field[FIELD_KEYS.NAME] !== "" &&
        VALID_TYPES.includes(field[FIELD_KEYS.TYPE]),
    )
    .map((field) => ({
      [FIELD_KEYS.NAME]: field[FIELD_KEYS.NAME],
      [FIELD_KEYS.TYPE]: field[FIELD_KEYS.TYPE],
      [FIELD_KEYS.REQUIRED]: Boolean(field[FIELD_KEYS.REQUIRED]),
      // Alleen een keuzelijst heeft opties.
      ...(field[FIELD_KEYS.TYPE] === FIELD_TYPES.SELECT
        ? {
            [FIELD_KEYS.OPTIONS]: Array.isArray(field[FIELD_KEYS.OPTIONS])
              ? field[FIELD_KEYS.OPTIONS].map(String)
              : [],
          }
        : {}),
    }));
}

export function serializeFieldDefinitions(fields) {
  return JSON.stringify(fields);
}

// Controleert de velden van een soort. Geeft een foutmelding terug, of null
// als alles goed is.
export function validateFieldDefinitions(fields) {
  const seen = new Set();

  for (const field of fields) {
    const name = field[FIELD_KEYS.NAME];

    if (!name) return "Elk veld heeft een naam nodig.";

    if (name.length > MAX_FIELD_NAME_LENGTH) {
      return `De veldnaam "${name}" is te lang (maximaal ${MAX_FIELD_NAME_LENGTH} tekens).`;
    }

    // Kleine letters, zodat "Kleur" en "kleur" als hetzelfde veld tellen.
    const key = name.toLowerCase();
    if (seen.has(key)) return `Het veld "${name}" staat er twee keer in.`;
    seen.add(key);

    if (!VALID_TYPES.includes(field[FIELD_KEYS.TYPE])) {
      return `Het veld "${name}" heeft een onbekend type.`;
    }

    if (
      field[FIELD_KEYS.TYPE] === FIELD_TYPES.SELECT &&
      (!field[FIELD_KEYS.OPTIONS] || field[FIELD_KEYS.OPTIONS].length === 0)
    ) {
      return `Geef de keuzelijst "${name}" minstens één keuze.`;
    }
  }

  return null;
}

// Leest de veldrijen uit het formulier. De lijsten horen per index bij elkaar:
// names[2] hoort bij types[2], enzovoort. Daarom stuurt elke rij altijd alle
// waarden mee, ook als ze leeg zijn, anders schuift alles op.
export function readFieldDefinitions(formData, formNames) {
  const names = formData.getAll(formNames.FIELD_NAME);
  const types = formData.getAll(formNames.FIELD_TYPE);
  const required = formData.getAll(formNames.FIELD_REQUIRED);
  const options = formData.getAll(formNames.FIELD_OPTIONS);

  return (
    names
      .map((name, index) => ({
        [FIELD_KEYS.NAME]: String(name).trim(),
        [FIELD_KEYS.TYPE]: String(types[index] ?? ""),
        [FIELD_KEYS.REQUIRED]: required[index] === "true",
        ...(types[index] === FIELD_TYPES.SELECT
          ? {
              [FIELD_KEYS.OPTIONS]: String(options[index] ?? "")
                .split(",")
                .map((option) => option.trim())
                .filter(Boolean),
            }
          : {}),
      }))
      // Een rij zonder naam is een lege rij: overslaan.
      .filter((field) => field[FIELD_KEYS.NAME] !== "")
  );
}