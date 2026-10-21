"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findTypeForUser } from "@/lib/types";
import { NOTE_TYPE, TYPE_FORM, ROUTES } from "@/lib/constants";
import {
  readFieldDefinitions,
  validateFieldDefinitions,
  serializeFieldDefinitions,
  parseFieldDefinitions,
  parseFieldValues,
  serializeFieldValues,
  planFieldMigration,
  hasMigration,
  migrateFieldValues,
} from "@/lib/fields";

const MAX_TYPE_NAME_LENGTH = 40;

/// Leest en controleert alles wat voor nieuw en bewerken hetzelfde is.
/// Geeft { error } of { name, icon, fields } terug.
function readTypeForm(formData) {
  const name = (formData.get(TYPE_FORM.NAME) ?? "").trim();
  const icon = (formData.get(TYPE_FORM.ICON) ?? "").trim();

  if (!name) return { error: "Geef de soort een naam.", name, icon };

  if (name.length > MAX_TYPE_NAME_LENGTH) {
    return { error: `Een naam mag maximaal ${MAX_TYPE_NAME_LENGTH} tekens zijn.`, name, icon };
  }

  // "notitie" is de ingebouwde soort voor losse notities.
  if (name.toLowerCase() === NOTE_TYPE.name) {
    return { error: `"${name}" is al de soort voor je notities. Kies een andere naam.`, name, icon };
  }

  // De browser stuurt wat hij wil: ook hier opnieuw controleren, niet alleen
  // vertrouwen op het formulier.
  const fields = readFieldDefinitions(formData, TYPE_FORM);
  const invalid = validateFieldDefinitions(fields);
  if (invalid) return { error: invalid, name, icon };

  return { name, icon, fields };
}

/// P2002: deze gebruiker heeft al een soort met deze naam (@@unique).
function isNameTaken(error) {
  return error?.code === "P2002";
}

export async function createItemType(previousState, formData) {
  const user = await requireUser();

  const form = readTypeForm(formData);
  // De ingevulde naam en het icoon gaan bij elke fout mee terug.
  if (form.error) return form;

  try {
    await prisma.itemType.create({
      data: {
        userId: user.id,
        name: form.name,
        icon: form.icon || null,
        // De velddefinities gaan als JSON-tekst de database in: zo kan een
        // nieuwe soort erbij zonder migratie.
        fieldDefinitions: serializeFieldDefinitions(form.fields),
      },
    });
  } catch (error) {
    if (isNameTaken(error)) {
      return { error: `Je hebt al een soort die "${form.name}" heet.`, name: form.name, icon: form.icon };
    }
    throw error;
  }

  revalidatePath(ROUTES.TYPES);
  redirect(ROUTES.TYPES);
}

export async function updateItemType(previousState, formData) {
  const user = await requireUser();

  const type = await findTypeForUser(user.id, formData.get(TYPE_FORM.ID));
  // Niet van jou, al weg, of de soort voor notities: niets aan te passen.
  if (!type || type.name === NOTE_TYPE.name) {
    return { error: "Deze soort bestaat niet meer.", name: "", icon: "" };
  }

  const form = readTypeForm(formData);
  if (form.error) return form;

  // Vergelijk de oude velden met de nieuwe: wat is hernoemd, wat is weg?
  const before = parseFieldDefinitions(type.fieldDefinitions);
  const plan = planFieldMigration(before, form.fields);

  try {
    // Eén transactie: de nieuwe velden en de verhuisde waarden horen bij
    // elkaar. Gaat er halverwege iets mis, dan blijft alles zoals het was,
    // in plaats van een soort met nieuwe namen en items met oude.
    await prisma.$transaction(async (tx) => {
      await tx.itemType.update({
        where: { id: type.id },
        data: {
          name: form.name,
          icon: form.icon || null,
          fieldDefinitions: serializeFieldDefinitions(form.fields),
        },
      });

      if (!hasMigration(plan)) return;

      const items = await tx.item.findMany({
        where: { typeId: type.id, userId: user.id },
        select: { id: true, fieldValues: true },
      });

      for (const item of items) {
        const next = migrateFieldValues(parseFieldValues(item.fieldValues), plan);
        await tx.item.update({
          where: { id: item.id },
          data: { fieldValues: serializeFieldValues(next) },
        });
      }
    });
  } catch (error) {
    if (isNameTaken(error)) {
      return { error: `Je hebt al een soort die "${form.name}" heet.`, name: form.name, icon: form.icon };
    }
    throw error;
  }

  revalidatePath(ROUTES.TYPES);
  revalidatePath(ROUTES.type(type.id));
  redirect(ROUTES.type(type.id));
}