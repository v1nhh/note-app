import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { parseFieldDefinitions, FIELD_KEYS } from "@/lib/fields";
import { FIELD_TYPE_LABELS, NOTE_TYPE, ROUTES } from "@/lib/constants";

export const metadata = { title: "Soorten" };

export default async function TypesPage() {
  const user = await requireUser();

  // De ingebouwde soort "notitie" hoort hier niet tussen: die maak je niet
  // zelf en heeft geen eigen velden.
  const types = await prisma.itemType.findMany({
    where: { userId: user.id, name: { not: NOTE_TYPE.name } },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <main className="page">
      <div className="flex items-center justify-between gap-4">
        <h1 className="view-title">Soorten</h1>
        <Link href={ROUTES.NEW_TYPE} className="btn btn-solid">
          Nieuwe soort
        </Link>
      </div>

      {types.length === 0 ? (
        <p className="mt-10 text-ink-3">
          Nog geen soorten. Maak er een voor de dingen die je bijhoudt: mensen,
          boeken, plekken.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {types.map((type) => {
            // De kolom is tekst; parseFieldDefinitions maakt er een bruikbare
            // array van, ook als er onzin in staat.
            const fields = parseFieldDefinitions(type.fieldDefinitions);

            return (
              <li key={type.id}>
                <Link
                  href={ROUTES.type(type.id)}
                  className="card card-link"
                >
                  <h2 className="font-semibold">
                    {type.icon ? `${type.icon} ` : ""}
                    {type.name}
                  </h2>
                  <p className="mt-1 text-sm text-ink-3">
                    {type._count.items} {type._count.items === 1 ? "item" : "items"}
                  </p>

                  {fields.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {fields.map((field) => (
                        <li
                          key={field[FIELD_KEYS.NAME]}
                          className="chip"
                        >
                          {field[FIELD_KEYS.NAME]} · {FIELD_TYPE_LABELS[field[FIELD_KEYS.TYPE]]}
                          {field[FIELD_KEYS.REQUIRED] ? " · verplicht" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-ink-3">Geen eigen velden.</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}