"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { searchItems } from "@/lib/search";
import { itemHref } from "@/lib/links";

const QUICK_RESULTS = 8;
const RECENT_RESULTS = 6;
const MAX_QUERY_LENGTH = 100;

/// Zoeken vanuit het ⌘K-venster. Dezelfde zoekfunctie als de zoekpagina,
/// maar minder resultaten. Zonder zoekwoord: wat je het laatst bewerkte.
///
/// Geeft gewone objecten terug (geen Date, geen Prisma-objecten): alles wat
/// een server action teruggeeft, gaat als JSON naar de browser.
export async function quickSearch(rawQuery) {
  // Een server action is van buitenaf aan te roepen: ook hier controleren
  // wie het is, en alleen in zijn eigen items zoeken.
  const user = await requireUser();
  const query = String(rawQuery ?? "").trim().slice(0, MAX_QUERY_LENGTH);

  if (!query) {
    const recent = await prisma.item.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: RECENT_RESULTS,
      include: { type: { select: { name: true, icon: true } } },
    });
    return { recent: true, results: recent.map((item) => toResult(item, "")) };
  }

  const found = await searchItems(user.id, { query });
  return {
    recent: false,
    results: found.slice(0, QUICK_RESULTS).map(({ item, snippet }) => toResult(item, snippet)),
  };
}

function toResult(item, snippet) {
  return {
    id: item.id,
    title: item.title,
    typeName: item.type.name,
    icon: item.type.icon,
    snippet,
    href: itemHref(item.id, item.type.name),
  };
}