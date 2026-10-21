"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NOTE_TYPE, NOTE_FORM } from "@/lib/constants";

/// Zorgt dat de soort "notitie" bestaat en geeft hem terug.
async function getNoteType() {
  return prisma.itemType.upsert({
    where: { name: NOTE_TYPE.name },
    update: {},
    create: { name: NOTE_TYPE.name, icon: NOTE_TYPE.icon },
  });
}

export async function createNote(formData) {
  const title = formData.get(NOTE_FORM.TITLE)?.trim();
  const body = formData.get(NOTE_FORM.BODY)?.trim() ?? "";

  // Voorlopig stil weigeren; echte validatie met foutmelding komt later.
  if (!title) return;

  const noteType = await getNoteType();

  await prisma.item.create({
    data: { typeId: noteType.id, title, body },
  });

  // Vertelt Next dat de gegevens van "/" verouderd zijn, zodat de lijst
  // opnieuw van de server wordt opgehaald.
  revalidatePath("/");
}