import { prisma } from "@/lib/prisma";
import { syncConnections } from "@/lib/links";
import { FIELD_KEYS, serializeFieldDefinitions, serializeFieldValues } from "@/lib/fields";
import { FIELD_TYPES, MENTION, NOTE_TYPE } from "@/lib/constants";

// Startset: de soorten die je krijgt als je een account maakt, en een paar
// voorbeelden. Alle namen staan hier en nergens anders. Na het aanmaken zijn
// het gewone soorten en items: je kunt ze dus weggooien of aanpassen.

/// Kort hulpje om een velddefinitie te maken, met de sleutels uit FIELD_KEYS.
const field = (name, type, required = false, options) => ({
  [FIELD_KEYS.NAME]: name,
  [FIELD_KEYS.TYPE]: type,
  [FIELD_KEYS.REQUIRED]: required,
  ...(options ? { [FIELD_KEYS.OPTIONS]: options } : {}),
});

/// De soorten apart, zodat de voorbeelden hieronder ernaar kunnen wijzen.
const TYPES = {
  person: {
    name: "persoon",
    icon: "👤",
    fields: [
      field("verjaardag", FIELD_TYPES.DATE),
      field("relatie", FIELD_TYPES.SELECT, false, ["familie", "vriend", "collega"]),
    ],
  },
  book: {
    name: "boek",
    icon: "📚",
    fields: [field("auteur", FIELD_TYPES.TEXT), field("uitgelezen", FIELD_TYPES.BOOLEAN)],
  },
  place: {
    name: "plek",
    icon: "📍",
    fields: [field("adres", FIELD_TYPES.TEXT)],
  },
  // De ingebouwde soort voor losse notities, zonder eigen velden.
  note: { name: NOTE_TYPE.name, icon: NOTE_TYPE.icon, fields: [] },
};

/// De titels in een const, zodat een @-verwijzing in de voorbeelden altijd
/// precies klopt met de titel van het item.
const TITLES = { sanne: "Sanne", book: "De avonden", place: "Café de Zwaan" };
const at = (title) => `${MENTION.TRIGGER}${title}`;

/// Voorbeelden, van oud naar nieuw. De welkomstnotitie staat als laatste, zodat
/// hij bovenaan je lijst verschijnt.
const EXAMPLES = [
  {
    type: TYPES.person,
    title: TITLES.sanne,
    body: "Een voorbeeld van een persoon. Onderaan haar pagina zie je elke notitie waarin Sanne genoemd wordt.",
    values: { relatie: "vriend" },
  },
  {
    type: TYPES.book,
    title: TITLES.book,
    body: `Tip van ${at(TITLES.sanne)}. Een boek heeft eigen velden, zoals auteur en uitgelezen.`,
    values: { auteur: "Gerard Reve", uitgelezen: false },
  },
  {
    type: TYPES.place,
    title: TITLES.place,
    body: "Een voorbeeld van een plek.",
    values: { adres: "Hoofdstraat 1" },
  },
  {
    type: TYPES.note,
    title: "Welkom! Zo werkt het",
    body: [
      `Typ @ en een naam om iets te koppelen. Vandaag zat ik met ${at(TITLES.sanne)} in ${at(TITLES.place)}. Ze raadde ${at(TITLES.book)} aan. Klik op Sanne en je ziet deze notitie daar terug.`,
      "Wat je bijhoudt bepaal je zelf. Onder Soorten staan persoon, boek en plek, elk met eigen velden. Maak er gerust een bij, bijvoorbeeld film of recept.",
      "Dit zijn allemaal voorbeelden. Gooi ze weg zodra je zelf begint.",
    ].join("\n\n"),
  },
];

/// De soorten als rijen voor prisma. Worden in één keer met het account
/// aangemaakt (zie register in app/auth-actions.js).
export function starterTypeRows() {
  return Object.values(TYPES).map((type) => ({
    name: type.name,
    icon: type.icon,
    fieldDefinitions: serializeFieldDefinitions(type.fields),
  }));
}

/// Zet de voorbeelden in het account. types: de soorten die net zijn
/// aangemaakt, om bij een naam de id te vinden.
export async function createStarterExamples(userId, types) {
  const typeId = (type) => types.find((row) => row.name === type.name).id;

  // Eerst alles aanmaken, dan pas koppelen: een @ kan alleen wijzen naar iets
  // dat al bestaat. Elk voorbeeld een minuut jonger dan het vorige, zodat de
  // volgorde vastligt.
  const created = [];
  for (const [index, example] of EXAMPLES.entries()) {
    const minutesAgo = EXAMPLES.length - 1 - index;
    const item = await prisma.item.create({
      data: {
        userId,
        typeId: typeId(example.type),
        title: example.title,
        body: example.body,
        date: new Date(Date.now() - minutesAgo * 60 * 1000),
        fieldValues: serializeFieldValues(example.values ?? {}),
      },
    });
    created.push(item);
  }

  for (const item of created) {
    await syncConnections(userId, item.id, item.body);
  }
}