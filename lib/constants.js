// Eén plek voor namen die de app zelf gebruikt. Zonder TypeScript vangt niets
// een typefout in een veldnaam, dus staan ze hier en nergens anders als losse
// tekst.

/// De veldtypes die een zelfgemaakte soort kan gebruiken. De waarde rechts
/// komt in de database; die verander je dus nooit meer.
export const FIELD_TYPES = {
  TEXT: "text",
  LONG_TEXT: "long_text",
  NUMBER: "number",
  DATE: "date",
  SELECT: "select",
  BOOLEAN: "boolean",
};

/// Hoe een veldtype in het scherm heet.
export const FIELD_TYPE_LABELS = {
  [FIELD_TYPES.TEXT]: "Tekst",
  [FIELD_TYPES.LONG_TEXT]: "Lange tekst",
  [FIELD_TYPES.NUMBER]: "Getal",
  [FIELD_TYPES.DATE]: "Datum",
  [FIELD_TYPES.SELECT]: "Keuzelijst",
  [FIELD_TYPES.BOOLEAN]: "Ja/nee",
};

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

/// Namen van de vaste velden op het formulier voor een item. De zelfgemaakte
/// velden krijgen hun naam uit de velddefinitie (zie fieldInputName).
export const ITEM_FORM = {
  ID: "id",
  TYPE_ID: "typeId",
  TITLE: "title",
  BODY: "body",
};

/// Namen van de velden op het inlog- en registratieformulier.
export const AUTH_FORM = {
  EMAIL: "email",
  PASSWORD: "password",
};

/// Het formulier om je account te wissen: alleen je huidige wachtwoord.
export const ACCOUNT_FORM = {
  PASSWORD: "currentPassword",
};

/// Namen van de velden op het formulier voor een soort. De FIELD_-namen komen
/// één keer per veldrij voor; de server leest ze als lijsten.
/// FIELD_ORIGINAL is de naam die het veld had toen je het formulier opende:
/// zo ziet de server of je een veld hernoemde of een nieuw veld toevoegde.
export const TYPE_FORM = {
  ID: "id",
  NAME: "name",
  ICON: "icon",
  FIELD_NAME: "fieldName",
  FIELD_TYPE: "fieldType",
  FIELD_REQUIRED: "fieldRequired",
  FIELD_OPTIONS: "fieldOptions",
  FIELD_ORIGINAL: "fieldOriginal",
};

/// De namen in de URL van de zoekpagina: /zoeken?q=koffie&soort=3
export const SEARCH_PARAMS = {
  QUERY: "q",
  TYPE: "soort",
};

/// Het teken waarmee je in een tekst naar een item verwijst: "@Sarah".
export const MENTION = {
  TRIGGER: "@",
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
  SEARCH: "/zoeken",
  SETTINGS: "/instellingen",
  TYPES: "/soorten",
  NEW_TYPE: "/soorten/nieuw",
  type: (id) => `/soorten/${id}`,
  editType: (id) => `/soorten/${id}/bewerken`,
  newItem: (typeId) => `/soorten/${typeId}/nieuw`,
  item: (id) => `/items/${id}`,
  editItem: (id) => `/items/${id}/bewerken`,
  note: (id) => `/notities/${id}`,
  editNote: (id) => `/notities/${id}/bewerken`,
};