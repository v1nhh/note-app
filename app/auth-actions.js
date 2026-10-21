"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { AUTH_FORM, ROUTES } from "@/lib/constants";

const MIN_PASSWORD_LENGTH = 8;

/// Een hash van een willekeurig wachtwoord dat niemand kent. Bij een onbekend
/// e-mailadres controleren we hiertegen, zodat inloggen even lang duurt als
/// bij een bestaand account. Anders kun je aan de reactietijd zien welke
/// e-mailadressen een account hebben. Eén keer gemaakt, daarna hergebruikt.
let dummyHash;
function getDummyHash() {
  dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
  return dummyHash;
}

function readCredentials(formData) {
  return {
    email: (formData.get(AUTH_FORM.EMAIL) ?? "").trim().toLowerCase(),
    password: formData.get(AUTH_FORM.PASSWORD) ?? "",
  };
}

/// Handmatige validatie, nog zonder Zod: die keuze staat nog open.
function validate({ email, password }) {
  if (!email.includes("@") || email.length < 3) {
    return "Vul een geldig e-mailadres in.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Kies een wachtwoord van minstens ${MIN_PASSWORD_LENGTH} tekens.`;
  }
  return null;
}

export async function register(previousState, formData) {
  const credentials = readCredentials(formData);

  // Het e-mailadres gaat mee terug, anders staat het veld na een foutmelding
  // weer leeg.
  const invalid = validate(credentials);
  if (invalid) return { error: invalid, email: credentials.email };

  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: credentials.email,
        passwordHash: await hashPassword(credentials.password),
      },
    });
  } catch (error) {
    // P2002: het e-mailadres bestaat al (de @unique in het schema).
    if (error?.code === "P2002") {
      return { error: "Dit e-mailadres is al in gebruik.", email: credentials.email };
    }
    throw error;
  }

  await createSession(user.id);

  // redirect() werkt door een fout te gooien die Next opvangt, dus hij staat
  // buiten de try/catch.
  redirect(ROUTES.HOME);
}

export async function login(previousState, formData) {
  const { email, password } = readCredentials(formData);

  const user = await prisma.user.findUnique({ where: { email } });

  const correct = await verifyPassword(
    user ? user.passwordHash : await getDummyHash(),
    password,
  );

  // Eén foutmelding voor "onbekend e-mailadres" en "verkeerd wachtwoord",
  // anders vertel je een aanvaller welke accounts bestaan.
  if (!user || !correct) {
    return { error: "E-mailadres of wachtwoord klopt niet.", email };
  }

  await createSession(user.id);

  redirect(ROUTES.HOME);
}

export async function logout() {
  await destroySession();
  redirect(ROUTES.LOGIN);
}