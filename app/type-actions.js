"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { NOTE_TYPE, TYPE_FORM, ROUTES } from "@/lib/constants";
import {
  readFieldDefinitions,
  validateFieldDefinitions,
  serializeFieldDefinitions,
} from "@/lib/fields";

const MAX_TYPE_NAME_LENGTH = 40;

export async function createItemType(previousState, formData) {
  const user = await requireUser();

  const name = (formData.get(TYPE_FORM.NAME) ?? "").trim();
  const icon = (formData.get(TYPE_FORM.ICON) ?? "").trim();

  // De ingevulde waarden gaan bij elke fout mee terug, zodat het formulier
  // niet leeg is als je het opnieuw probeert.
  const previous = { name, icon };

  if (!name) return { error: "Geef de soort een naam.", ...previous };

  if (name.length > MAX_TYPE_NAME_LENGTH) {
    return { error: `Een naam mag maximaal ${MAX_TYPE_NAME_LENGTH} tekens zijn.`, ...previous };
  }

  // "notitie" is de ingebouwde soort voor losse notities.
  if (name.toLowerCase() === NOTE_TYPE.name) {
    return { error: `"${name}" is al de soort voor je notities. Kies een andere naam.`, ...previous };
  }

  // De browser stuurt wat hij wil: ook hier opnieuw controleren, niet alleen
  // vertrouwen op het formulier.
  const fields = readFieldDefinitions(formData, TYPE_FORM);
  const invalid = validateFieldDefinitions(fields);
  if (invalid) return { error: invalid, ...previous };

  try {
    await prisma.itemType.create({
      data: {
        userId: user.id,
        name,
        icon: icon || null,
        // De velddefinities gaan als JSON-tekst de database in: zo kan een
        // nieuwe soort erbij zonder migratie.
        fieldDefinitions: serializeFieldDefinitions(fields),
      },
    });
  } catch (error) {
    // P2002: deze gebruiker heeft al een soort met deze naam (@@unique).
    if (error?.code === "P2002") {
      return { error: `Je hebt al een soort die "${name}" heet.`, ...previous };
    }
    throw error;
  }

  revalidatePath(ROUTES.TYPES);
  redirect(ROUTES.TYPES);
}