/// Toont een tekst met elk voorkomen van het zoekwoord gemarkeerd. Hoofd- en
/// kleine letters maken niet uit, maar de tekst zelf blijft zoals hij was.
export default function Highlight({ text, query }) {
    const needle = query.trim().toLowerCase();
    if (!needle) return text;
  
    const lower = text.toLowerCase();
    const parts = [];
    let cursor = 0;
    let index = lower.indexOf(needle);
  
    while (index !== -1) {
      if (index > cursor) parts.push(text.slice(cursor, index));
      parts.push(
        <mark key={index} className="rounded bg-yellow-100 px-0.5 text-inherit">
          {text.slice(index, index + needle.length)}
        </mark>,
      );
      cursor = index + needle.length;
      index = lower.indexOf(needle, cursor);
    }
  
    parts.push(text.slice(cursor));
    return parts;
  }