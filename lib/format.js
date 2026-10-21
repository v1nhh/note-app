/// Een datum zoals je hem in een notitieboek zou schrijven: "8 oktober 2026".
/// Op één plek, zodat de lijst en de notitiepagina hetzelfde tonen.
export function formatDate(date) {
    return date.toLocaleDateString("nl-NL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }