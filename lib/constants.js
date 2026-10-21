// Eén plek voor namen die de app zelf gebruikt. Zonder TypeScript vangt niets
// een typefout in een veldnaam, dus staan ze hier en nergens anders als losse
// tekst.

/// De ingebouwde soort waar losse notities in vallen.
export const NOTE_TYPE = {
  name: "notitie",
  icon: "📝",
};

/// Namen van de formuliervelden, gedeeld tussen formulier en server action.
export const NOTE_FORM = {
  ID: "id",
  TITLE: "title",
  BODY: "body",
};

/// Namen van de velden op het inlog- en registratieformulier.
export const AUTH_FORM = {
  EMAIL: "email",
  PASSWORD: "password",
};

/// Naam van de cookie waarin het sessietoken zit.
export const SESSION_COOKIE = "session";

/// Alle paden in de app. Een link bouw je met ROUTES.note(5), nooit met een
/// losse tekst als "/notities/5": een typefout geeft dan een fout in plaats
/// van een dode link.
export const ROUTES = {
  HOME: "/",
  LOGIN: "/inloggen",
  REGISTER: "/registreren",
  note: (id) => `/notities/${id}`,
  editNote: (id) => `/notities/${id}/bewerken`,
};