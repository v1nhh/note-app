import { prisma } from "@/lib/prisma";

/// Zoekt een notitie op, maar alleen als hij van deze gebruiker is. De id
/// komt uit de URL en kan van alles zijn, of van iemand anders: in beide
/// gevallen geeft dit null, en de pagina toont een 404.
export async function findNoteForUser(userId, rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;

  return prisma.item.findFirst({
    where: { id, userId },
  });
}