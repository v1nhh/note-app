"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NOTE_TYPE, NOTE_FORM, ROUTES } from "@/lib/constants";

/// Zorgt dat de soort "notitie" bestaat en geeft hem terug.
async function getNoteType() {
  return prisma.itemType.upsert({
    where: { name: NOTE_TYPE.name },
    update: {},
    create: { name: NOTE_TYPE.name, icon: NOTE_TYPE.icon },
  });
}

/// Leest de id uit een formulier. Een verborgen veld kan in de browser
/// aangepast worden, dus de server vertrouwt het niet blind.
function readId(formData) {
  const id = Number(formData.get(NOTE_FORM.ID));
  return Number.isInteger(id) && id > 0 ? id : null;
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
  revalidatePath(ROUTES.HOME);
}

export async function updateNote(formData) {
  const id = readId(formData);
  const title = formData.get(NOTE_FORM.TITLE)?.trim();
  const body = formData.get(NOTE_FORM.BODY)?.trim() ?? "";

  if (!id || !title) return;

  await prisma.item.update({
    where: { id },
    data: { title, body },
  });

  // De lijst én de notitiepagina tonen de oude tekst nog: allebei verversen.
  revalidatePath(ROUTES.HOME);
  revalidatePath(ROUTES.note(id));

  // Na bewaren terug naar de notitie, zodat je ziet wat er nu staat.
  redirect(ROUTES.note(id));
}

export async function deleteNote(formData) {
  const id = readId(formData);
  if (!id) return;

  await prisma.item.delete({ where: { id } });

  revalidatePath(ROUTES.HOME);

  // De pagina van de notitie bestaat niet meer, dus terug naar de lijst.
  redirect(ROUTES.HOME);
}