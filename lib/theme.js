import { cookies } from "next/headers";
import { PREFERENCE_COOKIES, THEMES } from "@/lib/constants";

/// Is dit een weergave die we kennen? Een cookie kan in de browser worden
/// aangepast, dus alles wat geen bekende waarde is, telt als "systeem".
export function isTheme(value) {
  return Object.values(THEMES).includes(value);
}

/// De gekozen weergave, uit de cookie. Geen of een onbekende waarde: systeem.
export async function readTheme() {
  const store = await cookies();
  const value = store.get(PREFERENCE_COOKIES.THEME)?.value;
  return isTheme(value) ? value : THEMES.SYSTEM;
}