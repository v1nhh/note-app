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

// ---------------------------------------------------------------------------
// Velddefinities: welke velden een soort heeft.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Veldwaarden: wat de gebruiker invult in het formulier dat de app opbouwt.
// ---------------------------------------------------------------------------

/// Zelfgemaakte velden krijgen een voorvoegsel in het formulier, zodat een
/// veld dat "title" heet nooit botst met de vaste titel van het item.
const FIELD_VALUE_PREFIX = "field:";

export function fieldInputName(fieldName) {
  return `${FIELD_VALUE_PREFIX}${fieldName}`;
}

/// <input type="date"> geeft altijd jjjj-mm-dd. Al het andere is geen datum
/// uit ons formulier.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/// Zelfde voorzichtigheid als bij de definities: het is tekst uit de database.
/// Geeft altijd een object terug, desnoods een leeg.
export function parseFieldValues(raw) {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function serializeFieldValues(values) {
  return JSON.stringify(values);
}

/// Leest per velddefinitie de waarde uit het formulier en zet hem om naar het
/// juiste type. We lopen door de definities, niet door het formulier: wat niet
/// in de definitie staat, komt de database niet in, ook als iemand extra
/// velden meestuurt.
export function readFieldValues(formData, fields) {
  const values = {};

  for (const field of fields) {
    const name = field[FIELD_KEYS.NAME];
    const raw = formData.get(fieldInputName(name));

    if (field[FIELD_KEYS.TYPE] === FIELD_TYPES.BOOLEAN) {
      // Een uitgevinkt vakje stuurt niets mee; dat betekent hier "nee".
      values[name] = raw === "on";
      continue;
    }

    const text = String(raw ?? "").trim();

    // Leeg laten we weg, in plaats van een 0 of een lege tekst te verzinnen.
    if (text === "") continue;

    if (field[FIELD_KEYS.TYPE] === FIELD_TYPES.NUMBER) {
      const number = Number(text);
      // Geen getal? Dan de tekst bewaren zoals hij getypt is. De controle
      // hieronder keurt hem af, en het formulier toont weer wat je typte.
      values[name] = Number.isFinite(number) ? number : text;
      continue;
    }

    values[name] = text;
  }

  return values;
}

/// Controleert de ingevulde waarden tegen de definities van de soort. Geeft
/// een foutmelding terug, of null als alles klopt.
export function validateFieldValues(fields, values) {
  for (const field of fields) {
    const name = field[FIELD_KEYS.NAME];
    const type = field[FIELD_KEYS.TYPE];
    const value = values[name];

    if (value === undefined) {
      // Bij ja/nee is "nee" ook een antwoord, dus die is nooit leeg.
      if (field[FIELD_KEYS.REQUIRED]) return `"${name}" is verplicht.`;
      continue;
    }

    if (type === FIELD_TYPES.NUMBER && typeof value !== "number") {
      return `"${name}" moet een getal zijn.`;
    }

    if (type === FIELD_TYPES.DATE && !isValidDate(value)) {
      return `"${name}" is geen geldige datum.`;
    }

    // Alleen keuzes die echt in de lijst staan. De browser toont alleen die
    // keuzes, maar een aangepast formulier kan van alles sturen.
    if (type === FIELD_TYPES.SELECT && !(field[FIELD_KEYS.OPTIONS] ?? []).includes(value)) {
      return `"${value}" is geen keuze bij "${name}".`;
    }
  }

  return null;
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  // 2026-02-31 past wel in het patroon, maar bestaat niet. Date maakt er
  // 3 maart van; dan klopt de datum terug niet meer met wat er stond.
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/// Hoe een waarde op het scherm komt. Eén plek, zodat een datum overal
/// hetzelfde geschreven wordt.
export function formatFieldValue(field, value) {
  if (value === undefined || value === "") return "—";

  switch (field[FIELD_KEYS.TYPE]) {
    case FIELD_TYPES.BOOLEAN:
      return value ? "ja" : "nee";

    case FIELD_TYPES.DATE: {
      if (!isValidDate(value)) return String(value);
      // UTC: anders kan een datum in een andere tijdzone een dag verschuiven.
      return new Date(`${value}T00:00:00Z`).toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    }

    default:
      return String(value);
  }
}