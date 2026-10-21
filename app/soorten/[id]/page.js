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
    <main className="page">
      <Link href={ROUTES.TYPES} className="back-link">
        ← Soorten
      </Link>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="view-title">
          {type.icon ? `${type.icon} ` : ""}
          {type.name}
        </h1>
        <div className="flex flex-wrap gap-2">
          {editable && (
            <Link
              href={ROUTES.editType(type.id)}
              className="btn"
            >
              Soort aanpassen
            </Link>
          )}
          <Link
            href={ROUTES.newItem(type.id)}
            className="btn btn-solid"
          >
            Nieuw: {type.name}
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-ink-3">Nog niets van deze soort.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {items.map((item) => {
            // Ook de waarden zijn tekst uit de database: eerst veilig inlezen.
            const values = parseFieldValues(item.fieldValues);

            return (
              <li key={item.id}>
                <Link
                  href={ROUTES.item(item.id)}
                  className="card card-link"
                >
                  <h2 className="font-semibold">{item.title}</h2>

                  {fields.length > 0 && (
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      {fields.map((field) => (
                        <div key={field[FIELD_KEYS.NAME]} className="contents">
                          <dt className="text-ink-3">{field[FIELD_KEYS.NAME]}</dt>
                          <dd>{formatFieldValue(field, values[field[FIELD_KEYS.NAME]])}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {item.body && (
                    <p className="mt-3 line-clamp-2 whitespace-pre-wrap text-ink-2">
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