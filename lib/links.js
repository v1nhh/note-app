import { prisma } from "@/lib/prisma";
import { findMentions } from "@/lib/mentions";

/// Alle items van een gebruiker waar je naar kunt verwijzen, nieuwste eerst:
/// [{ id, title, typeName, icon }]. Gewone objecten, zodat ze ook naar een
/// client component mogen.
export async function mentionTargets(userId) {
  const items = await prisma.item.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      type: { select: { name: true, icon: true } },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    typeName: item.type.name,
    icon: item.type.icon,
  }));
}

/// Zet de verbindingen van een item gelijk aan wat er in zijn tekst staat.
/// Wat genoemd wordt is verbonden, de rest niet meer. Zo hoef je nooit apart
/// te "ontkoppelen": haal de @ weg en bewaar.
///
/// We slaan maar één richting op: van dit item naar het genoemde item. De
/// terugweg ("genoemd in") vinden we later met toItemId, zonder tweede rij.
export async function syncConnections(userId, itemId, text) {
  // Alleen eigen items, en niet naar jezelf verwijzen.
  const targets = (await mentionTargets(userId)).filter((target) => target.id !== itemId);
  const wanted = new Set(findMentions(text, targets).map((mention) => mention.target.id));

  const existing = await prisma.connection.findMany({
    where: { fromItemId: itemId },
    select: { toItemId: true },
  });
  const current = new Set(existing.map((row) => row.toItemId));

  // Alleen het verschil wegschrijven: wat erbij komt en wat weg moet.
  const toRemove = [...current].filter((id) => !wanted.has(id));
  const toAdd = [...wanted].filter((id) => !current.has(id));

  // Een transactie: alles lukt, of niets. Nooit een half bijgewerkte lijst.
  await prisma.$transaction([
    prisma.connection.deleteMany({
      where: { fromItemId: itemId, toItemId: { in: toRemove } },
    }),
    ...toAdd.map((toItemId) =>
      prisma.connection.create({ data: { fromItemId: itemId, toItemId } }),
    ),
  ]);

  return { added: toAdd.length, removed: toRemove.length };
}