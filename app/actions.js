"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { syncConnections } from "@/lib/links";
import { NOTE_TYPE, NOTE_FORM, ROUTES } from "@/lib/constants";

/// Zorgt dat deze gebruiker een soort "notitie" heeft en geeft hem terug.
/// Elke gebruiker heeft zijn eigen soorten.
async function getNoteType(userId) {
  return prisma.itemType.upsert({
    where: { userId_name: { userId, name: NOTE_TYPE.name } },
    update: {},
    create: { userId, name: NOTE_TYPE.name, icon: NOTE_TYPE.icon },
  });
}

/// Leest de id uit een formulier. Een verborgen veld kan in de browser
/// aangepast worden, dus de server vertrouwt het niet blind.
function readId(formData) {
  const id = Number(formData.get(NOTE_FORM.ID));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createNote(formData) {
  // Een server action is van buitenaf aan te roepen, ook zonder de pagina.
  // Dus ook hier controleren wie het is, niet alleen op de pagina.
  const user = await requireUser();

  const title = formData.get(NOTE_FORM.TITLE)?.trim();
  const body = formData.get(NOTE_FORM.BODY)?.trim() ?? "";

  // Voorlopig stil weigeren; echte validatie met foutmelding komt later.
  if (!title) return;

  const noteType = await getNoteType(user.id);

  const note = await prisma.item.create({
    data: { userId: user.id, typeId: noteType.id, title, body },
  });

  // Elke @ in de tekst wordt een verbinding.
  await syncConnections(user.id, note.id, body);

  revalidatePath(ROUTES.HOME);

  // Naar de nieuwe notitie: daar zie je meteen met wie hij verbonden is.
  redirect(ROUTES.note(note.id));
}

export async function updateNote(formData) {
  const user = await requireUser();
  const id = readId(formData);
  const title = formData.get(NOTE_FORM.TITLE)?.trim();
  const body = formData.get(NOTE_FORM.BODY)?.trim() ?? "";

  if (!id || !title) return;

  // updateMany in plaats van update: met userId erbij raakt een id van iemand
  // anders nul rijen, in plaats van zijn notitie te overschrijven.
  const { count } = await prisma.item.updateMany({
    where: { id, userId: user.id },
    data: { title, body },
  });

  // Niet van jou (of al weg): dan ook geen verbindingen aanpassen.
  if (count === 0) return;

  // Nieuwe @ erbij of eentje weggehaald: de verbindingen volgen de tekst.
  await syncConnections(user.id, id, body);

  revalidatePath(ROUTES.HOME);
  revalidatePath(ROUTES.note(id));
  redirect(ROUTES.note(id));
}

export async function deleteNote(formData) {
  const user = await requireUser();
  const id = readId(formData);
  if (!id) return;

  // Zelfde reden als hierboven: alleen je eigen notitie kan weg. Zijn
  // verbindingen gaan vanzelf mee (onDelete: Cascade in het schema).
  await prisma.item.deleteMany({ where: { id, userId: user.id } });

  revalidatePath(ROUTES.HOME);
  redirect(ROUTES.HOME);
}