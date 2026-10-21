import { prisma } from "@/lib/prisma";

/// Zoekt een item op, met zijn soort, maar alleen als het van deze gebruiker
/// is. De id komt uit de URL en kan van alles zijn: dan geeft dit null.
export async function findItemForUser(userId, rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return null;

  return prisma.item.findFirst({
    where: { id, userId },
    include: { type: true },
  });
}