import { prisma } from "@/lib/prisma";
import { findMentions } from "@/lib/mentions";
import { MENTION, NOTE_TYPE, ROUTES } from "@/lib/constants";

/// Waar een item te lezen is. Notities hebben hun eigen pagina (met bewerken),
/// al het andere de itempagina.
export function itemHref(id, typeName) {
  return typeName === NOTE_TYPE.name ? ROUTES.note(id) : ROUTES.item(id);
}

/// Alle items van een gebruiker waar je naar kunt verwijzen, nieuwste eerst:
/// [{ id, title, typeName, icon }]. Gewone objecten, zodat ze ook naar een
/// client component mogen.
///
/// db is normaal prisma. Binnen een transactie geef je tx mee, zodat deze
/// query in dezelfde transactie meedoet.
export async function mentionTargets(userId, db = prisma) {
  const items = await db.item.findMany({
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

/// Een item krijgt een nieuwe titel: herschrijf elke @verwijzing ernaar.
/// "@Sanne" wordt "@Sanne de Vries". Verwijzingen werken op titel, dus zonder
/// dit zou de verbinding bij het volgende bewaren van die notitie verdwijnen.
///
/// Roep dit aan vóórdat de nieuwe titel is opgeslagen, binnen dezelfde
/// transactie. Geeft terug hoeveel stukken er zijn aangepast.
export async function renameMentions(userId, itemId, oldTitle, newTitle, db = prisma) {
  if (oldTitle === newTitle) return 0;

  // Alleen de stukken die naar dit item verwijzen; die kennen we al via de
  // verbindingen, dus we hoeven niet alle teksten te doorzoeken.
  const incoming = await db.connection.findMany({
    where: { toItemId: itemId, fromItem: { userId } },
    select: { fromItem: { select: { id: true, body: true } } },
  });
  if (incoming.length === 0) return 0;

  // Met álle titels zoeken, zodat "@Oma" niet verward wordt met "@Oma Rietje".
  // Voor dit item de oude titel: zo staat hij nog in de teksten.
  const targets = (await mentionTargets(userId, db)).map((target) =>
    target.id === itemId ? { ...target, title: oldTitle } : target,
  );

  let changed = 0;
  for (const { fromItem } of incoming) {
    const mentions = findMentions(fromItem.body, targets).filter(
      (mention) => mention.target.id === itemId,
    );
    if (mentions.length === 0) continue;

    // Van achter naar voren vervangen. Een langere titel schuift alles erna
    // op; van achteren beginnen houdt de posities ervoor kloppend.
    let body = fromItem.body;
    for (const mention of mentions.toReversed()) {
      body = body.slice(0, mention.start) + `${MENTION.TRIGGER}${newTitle}` + body.slice(mention.end);
    }

    await db.item.update({ where: { id: fromItem.id }, data: { body } });
    changed += 1;
  }

  return changed;
}

/// Zet de verbindingen van een item gelijk aan wat er in zijn tekst staat.
/// Wat genoemd wordt is verbonden, de rest niet meer. Zo hoef je nooit apart
/// te "ontkoppelen": haal de @ weg en bewaar.
///
/// We slaan maar één richting op: van dit item naar het genoemde item. De
/// terugweg ("genoemd in") vinden we met toItemId, zonder tweede rij.
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