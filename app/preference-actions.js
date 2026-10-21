"use server";

import { cookies } from "next/headers";
import { isTheme } from "@/lib/theme";
import { PREFERENCE_COOKIES } from "@/lib/constants";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/// Bewaart de gekozen weergave in een cookie. De browser past de keuze zelf
/// al toe (zie ThemePicker); de cookie is er zodat de server de volgende
/// pagina meteen in de goede kleuren maakt.
export async function setTheme(theme) {
  // Alleen bekende waarden: dit is een server action, dus van buitenaf aan te
  // roepen met wat dan ook.
  if (!isTheme(theme)) return { ok: false };

  const store = await cookies();
  store.set(PREFERENCE_COOKIES.THEME, theme, {
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
    sameSite: "lax",
    httpOnly: true,
  });

  return { ok: true };
}