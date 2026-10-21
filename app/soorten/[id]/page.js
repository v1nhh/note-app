import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findTypeForUser } from "@/lib/types";
import {
  parseFieldDefinitions,
  parseFieldValues,
  formatFieldValue,
  FIELD_KEYS,
} from "@/lib/fields";
import { NOTE_TYPE, ROUTES } from "@/lib/constants";

export default async function TypePage({ params }) {
  const user = await requireUser();
  const { id } = await params;

  const type = await findTypeForUser(user.id, id);
  if (!type) notFound();

  const items = await prisma.item.findMany({
    where: { typeId: type.id, userId: user.id },
    orderBy: { date: "desc" },
  });

  const fields = parseFieldDefinitions(type.fieldDefinitions);
  const editable = type.name !== NOTE_TYPE.name;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={ROUTES.TYPES} className="text-sm text-neutral-500 underline">
        ← Soorten
      </Link>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">
          {type.icon ? `${type.icon} ` : ""}
          {type.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Link
              href={ROUTES.editType(type.id)}
              className="rounded-md border border-neutral-300 px-4 py-2 hover:border-neutral-500"
            >
              Soort aanpassen
            </Link>
          )}
          <Link
            href={ROUTES.newItem(type.id)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-white"
          >
            Nieuw: {type.name}
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-neutral-500">Nog niets van deze soort.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {items.map((item) => {
            // Ook de waarden zijn tekst uit de database: eerst veilig inlezen.
            const values = parseFieldValues(item.fieldValues);

            return (
              <li key={item.id}>
                <Link
                  href={ROUTES.item(item.id)}
                  className="block rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-400"
                >
                  <h2 className="font-semibold">{item.title}</h2>

                  {fields.length > 0 && (
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      {fields.map((field) => (
                        <div key={field[FIELD_KEYS.NAME]} className="contents">
                          <dt className="text-neutral-500">{field[FIELD_KEYS.NAME]}</dt>
                          <dd>{formatFieldValue(field, values[field[FIELD_KEYS.NAME]])}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {item.body && (
                    <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-neutral-700">
                      {item.body}
                    </p>
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