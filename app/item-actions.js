"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findTypeForUser } from "@/lib/types";
import { ITEM_FORM, ROUTES } from "@/lib/constants";
import {
  parseFieldDefinitions,
  readFieldValues,
  validateFieldValues,
  serializeFieldValues,
} from "@/lib/fields";

export async function createItem(previousState, formData) {
  const user = await requireUser();

  // De soort moet van deze gebruiker zijn: anders kun je met een gegokte id
  // een item onder de soort van iemand anders hangen.
  const type = await findTypeForUser(user.id, formData.get(ITEM_FORM.TYPE_ID));
  if (!type) return { error: "Die soort bestaat niet.", title: "", body: "", values: {} };

  const title = (formData.get(ITEM_FORM.TITLE) ?? "").trim();
  const body = (formData.get(ITEM_FORM.BODY) ?? "").trim();

  // De definitie van de soort bepaalt wat er uit het formulier gelezen wordt.
  const fields = parseFieldDefinitions(type.fieldDefinitions);
  const values = readFieldValues(formData, fields);

  // Alles wat ingevuld was, gaat bij een fout mee terug het formulier in.
  const previous = { title, body, values };

  if (!title) return { error: "Geef het item een titel.", ...previous };

  const invalid = validateFieldValues(fields, values);
  if (invalid) return { error: invalid, ...previous };

  await prisma.item.create({
    data: {
      userId: user.id,
      typeId: type.id,
      title,
      body,
      // Net als de definities: JSON-tekst in één kolom.
      fieldValues: serializeFieldValues(values),
    },
  });

  revalidatePath(ROUTES.type(type.id));
  revalidatePath(ROUTES.TYPES);

  // Terug naar de soort: daar staat het nieuwe item met zijn velden. Een eigen
  // pagina per item komt bij stap 8, met de terugkoppelingen.
  redirect(ROUTES.type(type.id));
}