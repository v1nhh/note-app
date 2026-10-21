import { prisma } from "@/lib/prisma";
import { parseFieldValues } from "@/lib/fields";

const MAX_RESULTS = 50;

/// Hoeveel tekens tekst er links en rechts van een treffer in het fragment
/// komen.
const SNIPPET_RADIUS = 60;

/// Zoekt in de items van één gebruiker. query mag leeg zijn (dan alleen
/// filteren op soort), typeId ook (dan alle soorten).
///
/// Geeft [{ item, snippet }] terug. snippet laat zien wáár het zoekwoord
/// stond: een stukje tekst, of "veldnaam: waarde".
export async function searchItems(userId, { query, typeId }) {
  const text = query.trim();

  const where = { userId };
  if (typeId) where.typeId = typeId;

  // Eerst grof zoeken in de database. fieldValues is JSON-tekst, dus
  // "contains" vindt ook veldnamen, niet alleen waarden. Dat zeven we
  // hieronder in JavaScript weer uit.
  if (text) {
    where.OR = [
      { title: { contains: text } },
      { body: { contains: text } },
      { fieldValues: { contains: text } },
    ];
  }

  const items = await prisma.item.findMany({
    where,
    orderBy: { date: "desc" },
    include: { type: { select: { name: true, icon: true } } },
  });

  const results = [];
  for (const item of items) {
    // Geen zoekwoord: alles van de gekozen soort telt, met het begin van de
    // tekst als fragment.
    const snippet = text ? findMatch(item, text) : startOf(item.body);
    if (snippet === null) continue;

    results.push({ item, snippet });
    if (results.length === MAX_RESULTS) break;
  }

  return results;
}

/// Waar staat het zoekwoord? Geeft het fragment terug, of null als het er
/// niet echt in staat (alleen in een veldnaam van de JSON).
function findMatch(item, text) {
  const lower = text.toLowerCase();

  if (item.title.toLowerCase().includes(lower)) return startOf(item.body);

  const bodyIndex = item.body.toLowerCase().indexOf(lower);
  if (bodyIndex !== -1) return around(item.body, bodyIndex, text.length);

  // Alleen de waarden van de velden, niet de namen. Ja/nee slaan we over:
  // anders vindt zoeken op "true" elk vinkje.
  const values = parseFieldValues(item.fieldValues);
  for (const [name, value] of Object.entries(values)) {
    if (typeof value === "boolean") continue;
    if (String(value).toLowerCase().includes(lower)) return `${name}: ${value}`;
  }

  return null;
}

/// Het begin van een tekst, op één regel.
function startOf(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > SNIPPET_RADIUS * 2 ? `${flat.slice(0, SNIPPET_RADIUS * 2)}…` : flat;
}

/// Een stukje tekst rond de treffer, afgerond op hele woorden.
function around(text, index, length) {
  let start = Math.max(0, index - SNIPPET_RADIUS);
  let end = Math.min(text.length, index + length + SNIPPET_RADIUS);

  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < index) start = space + 1;
  }
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    if (space > index + length) end = space;
  }

  const flat = text.slice(start, end).replace(/\s+/g, " ");
  return `${start > 0 ? "…" : ""}${flat}${end < text.length ? "…" : ""}`;
}