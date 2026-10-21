import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { ROUTES, SESSION_COOKIE } from "@/lib/constants";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 dagen

// Het token gaat in de cookie, de hash ervan in de database. Met een gestolen
// database kun je dus niet inloggen. Het token is al volledig willekeurig, dus
// een snelle hash (SHA-256) is hier genoeg. Voor wachtwoorden niet: die zijn
// te raden, daarom gebruiken die argon2.
function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId) {
  // 32 willekeurige bytes: niet te raden.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript in de browser kan er niet bij (tegen XSS)
    sameSite: "lax", // niet meesturen bij formulieren van andere sites (tegen CSRF)
    secure: process.env.NODE_ENV === "production", // alleen via https, behalve lokaal
    path: "/",
    expires: expiresAt,
  });
}

// cache(): één databasequery per request, ook als meerdere componenten dit
// tegelijk aanroepen.
export const getCurrentSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  // Een verlopen sessie meteen opruimen.
  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session;
});

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

// Voor pagina's en acties waar je ingelogd moet zijn. redirect() stopt de
// functie, dus wat erna komt draait alleen met een gebruiker.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect(ROUTES.LOGIN);
  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    // Ook in de database weggooien, anders werkt een gekopieerd token nog.
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}