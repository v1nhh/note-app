import { prisma } from "@/lib/prisma";
import { layoutGraph } from "@/lib/force";
import { itemHref } from "@/lib/links";
import { NOTE_TYPE } from "@/lib/constants";

/// Een kleur per soort. Middentinten, zodat ze op een witte én een donkere
/// kaart te zien zijn. Notities krijgen geen kleur: die zijn grijs.
const TYPE_COLORS = [
  "#d97706",
  "#16a34a",
  "#0891b2",
  "#4f46e5",
  "#c026d3",
  "#e11d48",
  "#65a30d",
  "#0d9488",
];

/// Alles wat het web nodig heeft: knopen met hun plek, de lijnen ertussen, en
/// een legenda. Alleen titels en soorten, geen tekst: die is hier niet nodig.
///
/// De plek van elke knoop wordt hier, op de server, uitgerekend. De browser
/// krijgt een kant-en-klaar web en hoeft alleen te tekenen.
export async function loadGraph(userId) {
  const [items, connections, types] = await Promise.all([
    prisma.item.findMany({
      where: { userId },
      // Op id: zo blijft de volgorde, en daarmee de vorm, zo veel mogelijk gelijk.
      orderBy: { id: "asc" },
      select: { id: true, title: true, typeId: true, type: { select: { name: true } } },
    }),
    prisma.connection.findMany({
      where: { fromItem: { userId } },
      select: { fromItemId: true, toItemId: true },
    }),
    prisma.itemType.findMany({
      where: { userId, name: { not: NOTE_TYPE.name } },
      orderBy: { id: "asc" },
      select: { id: true, name: true, icon: true },
    }),
  ]);

  const colors = new Map(
    types.map((type, index) => [type.id, TYPE_COLORS[index % TYPE_COLORS.length]]),
  );

  // Hoeveel verbindingen een knoop heeft, in beide richtingen. Dat bepaalt
  // hoe groot hij getekend wordt.
  const degree = new Map();
  for (const { fromItemId, toItemId } of connections) {
    degree.set(fromItemId, (degree.get(fromItemId) ?? 0) + 1);
    degree.set(toItemId, (degree.get(toItemId) ?? 0) + 1);
  }

  const links = connections.map((row) => ({ source: row.fromItemId, target: row.toItemId }));
  const positions = new Map(
    layoutGraph(items, links).map((position) => [position.id, position]),
  );

  const nodes = items.map((item) => {
    const isNote = item.type.name === NOTE_TYPE.name;
    const { x, y } = positions.get(item.id);
    return {
      id: item.id,
      title: item.title,
      typeName: item.type.name,
      href: itemHref(item.id, item.type.name),
      isNote,
      color: isNote ? null : colors.get(item.typeId),
      degree: degree.get(item.id) ?? 0,
      x,
      y,
    };
  });

  const legend = types.map((type) => ({ ...type, color: colors.get(type.id) }));

  return { nodes, links, legend };
}