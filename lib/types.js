import { prisma } from "@/lib/prisma";

/// Zoekt een soort op, maar alleen als hij van deze gebruiker is. De id komt
/// uit de URL of een formulier en kan van alles zijn: dan geeft dit null.
export async function findTypeForUser(userId, rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;

  return prisma.itemType.findFirst({
    where: { id, userId },
  });
}