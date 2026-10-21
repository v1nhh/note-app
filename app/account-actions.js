"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, destroySession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";
import { ACCOUNT_FORM, ROUTES } from "@/lib/constants";

export async function deleteAccount(previousState, formData) {
  const user = await requireUser();

  // Eerst opnieuw het wachtwoord, ook al ben je ingelogd. Iemand die even aan
  // je open laptop zit, of een gestolen sessiecookie, mag je account niet in
  // één klik kunnen wissen.
  const password = String(formData.get(ACCOUNT_FORM.PASSWORD) ?? "");
  const correct = await verifyPassword(user.passwordHash, password);
  if (!correct) {
    return { error: "Dat wachtwoord klopt niet. Er is niets gewist." };
  }

  // Eén query is genoeg. In het schema staat bij sessies, soorten en items
  // onDelete: Cascade naar de gebruiker, en bij verbindingen naar de items.
  // De database ruimt dus zelf alles op wat bij dit account hoort, in één
  // keer: het lukt helemaal of het gebeurt niet.
  await prisma.user.delete({ where: { id: user.id } });

  // De sessie in de database is al weg; nu ook de cookie in de browser.
  await destroySession();

  redirect(ROUTES.REGISTER);
}