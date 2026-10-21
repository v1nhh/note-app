"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findTypeForUser } from "@/lib/types";
import { findItemForUser } from "@/lib/items";
import { renameMentions, syncConnections } from "@/lib/links";
import { ITEM_FORM, ROUTES } from "@/lib/constants";
import {
  parseFieldDefinitions,
  readFieldValues,
  validateFieldValues,
  serializeFieldValues,
} from "@/lib/fields";

const EMPTY_FORM = { title: "", body: "", values: {} };

/// Leest titel, tekst en de zelfgemaakte velden, en controleert ze tegen de
/// definitie van de soort. Hetzelfde voor nieuw en bewerken. Geeft
/// { error, title, body, values } terug; error is null als alles klopt.
function readItemForm(formData, type) {
  const title = (formData.get(ITEM_FORM.TITLE) ?? "").trim();
  const body = (formData.get(ITEM_FORM.BODY) ?? "").trim();

  // De definitie van de soort bepaalt wat er uit het formulier gelezen wordt.
  const fields = parseFieldDefinitions(type.fieldDefinitions);
  const values = readFieldValues(formData, fields);

  const error = !title ? "Geef het item een titel." : validateFieldValues(fields, values);

  // Alles wat ingevuld was, gaat bij een fout mee terug het formulier in.
  return { error, title, body, values };
}

export async function createItem(previousState, formData) {
  const user = await requireUser();

  // De soort moet van deze gebruiker zijn: anders kun je met een gegokte id
  // een item onder de soort van iemand anders hangen.
  const type = await findTypeForUser(user.id, formData.get(ITEM_FORM.TYPE_ID));
  if (!type) return { error: "Die soort bestaat niet.", ...EMPTY_FORM };

  const form = readItemForm(formData, type);
  if (form.error) return form;

  const item = await prisma.item.create({
    data: {
      userId: user.id,
      typeId: type.id,
      title: form.title,
      body: form.body,
      // Net als de definities: JSON-tekst in één kolom.
      fieldValues: serializeFieldValues(form.values),
    },
  });

  // Ook in de tekst van een item wordt elke @ een verbinding.
  await syncConnections(user.id, item.id, form.body);

  revalidatePath(ROUTES.type(type.id));
  revalidatePath(ROUTES.TYPES);

  // Naar het nieuwe item: daar staan zijn velden en wie hem noemt.
  redirect(ROUTES.item(item.id));
}

export async function updateItem(previousState, formData) {
  const user = await requireUser();

  // Het item (met zijn soort) moet van deze gebruiker zijn. De soort komt uit
  // de database, niet uit het formulier: zo kun je een item niet stiekem
  // naar een andere soort verhuizen.
  const item = await findItemForUser(user.id, formData.get(ITEM_FORM.ID));
  if (!item) return { error: "Dit item bestaat niet meer.", ...EMPTY_FORM };

  const form = readItemForm(formData, item.type);
  if (form.error) return form;

  // Nieuwe titel en de verwijzingen in andere stukken horen bij elkaar:
  // samen in één transactie.
  await prisma.$transaction(async (tx) => {
    await renameMentions(user.id, item.id, item.title, form.title, tx);
    await tx.item.update({
      where: { id: item.id },
      data: {
        title: form.title,
        body: form.body,
        fieldValues: serializeFieldValues(form.values),
      },
    });
  });

  // De verbindingen volgen de nieuwe tekst.
  await syncConnections(user.id, item.id, form.body);

  revalidatePath(ROUTES.type(item.typeId));
  revalidatePath(ROUTES.item(item.id));
  redirect(ROUTES.item(item.id));
}

export async function deleteItem(formData) {
  const user = await requireUser();

  const item = await findItemForUser(user.id, formData.get(ITEM_FORM.ID));
  if (!item) return;

  // Verbindingen van en naar dit item gaan vanzelf mee (onDelete: Cascade).
  // In de teksten die hem noemden blijft "@Sanne" gewoon als tekst staan.
  await prisma.item.deleteMany({ where: { id: item.id, userId: user.id } });

  revalidatePath(ROUTES.type(item.typeId));
  revalidatePath(ROUTES.TYPES);

  // De pagina van het item bestaat niet meer: terug naar zijn soort.
  redirect(ROUTES.type(item.typeId));
}