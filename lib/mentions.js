import { MENTION } from "@/lib/constants";

// Zoekt @-verwijzingen in een tekst: "@Oma Rietje belde" -> Oma Rietje.
//
// We zoeken niet naar "een @ gevolgd door een woord", want een titel kan uit
// meer woorden bestaan. We kijken welke bestaande titel er na de @ staat.
// - De langste titel wint: "@Oma Rietje" gaat voor "@Oma".
// - Na de titel moet het woord ophouden: "@Sarahs" verwijst niet naar "Sarah".
// - Een @ midden in een woord telt niet: info@sarah.nl is geen verwijzing.
//
// Draait op de server (verbindingen opslaan) en in de browser (tonen).

/// Een letter, cijfer of _ in elke taal (\p{L} pakt ook é, ö, enzovoort).
const LETTER = /[\p{L}\p{N}_]/u;

/// Hoeveel tekens tekst er links en rechts van een verwijzing in een
/// fragment komen.
const EXCERPT_RADIUS = 80;

/// targets: [{ id, title }]. Geeft [{ start, end, target }] terug, in de
/// volgorde waarin ze in de tekst staan.
export function findMentions(text, targets) {
  const source = String(text ?? "");
  if (!source.includes(MENTION.TRIGGER) || targets.length === 0) return [];

  // Langste titels eerst, en alvast in kleine letters, zodat "@sarah" ook
  // telt. sort is stabiel: bij gelijke lengte blijft de volgorde uit de
  // database staan (nieuwste eerst).
  const sorted = targets
    .filter((target) => target.title)
    .toSorted((a, b) => b.title.length - a.title.length)
    .map((target) => ({ target, lower: target.title.toLowerCase() }));
  const lowerSource = source.toLowerCase();

  const found = [];
  let index = source.indexOf(MENTION.TRIGGER);

  while (index !== -1) {
    const before = index > 0 ? source[index - 1] : "";
    let match = null;

    if (!LETTER.test(before)) {
      for (const { target, lower } of sorted) {
        const from = index + 1;
        const to = from + lower.length;
        const after = source[to] ?? "";

        if (lowerSource.startsWith(lower, from) && !LETTER.test(after)) {
          match = { start: index, end: to, target };
          break;
        }
      }
    }

    if (match) {
      found.push(match);
      // Verder zoeken ná de verwijzing, zodat een @ in een titel niet
      // nog een keer telt.
      index = source.indexOf(MENTION.TRIGGER, match.end);
    } else {
      index = source.indexOf(MENTION.TRIGGER, index + 1);
    }
  }

  return found;
}

/// Splitst een tekst in gewone stukken en verwijzingen, om te kunnen tonen:
/// [{ text: "Koffie met " }, { text: "@Sarah", target }, { text: " gedronken" }]
export function splitMentions(text, targets) {
  const source = String(text ?? "");
  const parts = [];
  let cursor = 0;

  for (const mention of findMentions(source, targets)) {
    if (mention.start > cursor) parts.push({ text: source.slice(cursor, mention.start) });
    parts.push({ text: source.slice(mention.start, mention.end), target: mention.target });
    cursor = mention.end;
  }

  if (cursor < source.length) parts.push({ text: source.slice(cursor) });
  return parts;
}

/// Het stukje tekst rond de eerste verwijzing naar één item, voor "Genoemd
/// in": { before, mention, after }, of null als het item er niet in staat.
///
/// We zoeken met álle titels en kiezen daarna het juiste item. Zoek je alleen
/// naar "Oma", dan zou "@Oma Rietje" ook als "@Oma" tellen.
export function mentionExcerpt(text, targets, targetId) {
  const source = String(text ?? "");
  const mention = findMentions(source, targets).find((found) => found.target.id === targetId);
  if (!mention) return null;

  let start = Math.max(0, mention.start - EXCERPT_RADIUS);
  let end = Math.min(source.length, mention.end + EXCERPT_RADIUS);

  // Niet midden in een woord beginnen of ophouden.
  if (start > 0) {
    const space = source.indexOf(" ", start);
    if (space !== -1 && space < mention.start) start = space + 1;
  }
  if (end < source.length) {
    const space = source.lastIndexOf(" ", end);
    if (space > mention.end) end = space;
  }

  // Enters worden spaties: een fragment is één regel.
  const flat = (part) => part.replace(/\s+/g, " ");

  return {
    before: (start > 0 ? "…" : "") + flat(source.slice(start, mention.start)),
    mention: source.slice(mention.start, mention.end),
    after: flat(source.slice(mention.end, end)) + (end < source.length ? "…" : ""),
  };
}