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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Soorten</h1>
        <Link href={ROUTES.NEW_TYPE} className="rounded-md bg-neutral-900 px-4 py-2 text-white">
          Nieuwe soort
        </Link>
      </div>

      {types.length === 0 ? (
        <p className="mt-10 text-neutral-500">
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
                  className="block rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-400"
                >
                  <h2 className="font-semibold">
                    {type.icon ? `${type.icon} ` : ""}
                    {type.name}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {type._count.items} {type._count.items === 1 ? "item" : "items"}
                  </p>

                  {fields.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {fields.map((field) => (
                        <li
                          key={field[FIELD_KEYS.NAME]}
                          className="rounded-md border border-neutral-200 px-2 py-1 text-sm text-neutral-600"
                        >
                          {field[FIELD_KEYS.NAME]} · {FIELD_TYPE_LABELS[field[FIELD_KEYS.TYPE]]}
                          {field[FIELD_KEYS.REQUIRED] ? " · verplicht" : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-500">Geen eigen velden.</p>
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