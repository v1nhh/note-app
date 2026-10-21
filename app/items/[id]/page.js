import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { findItemForUser } from "@/lib/items";
import { mentionTargets } from "@/lib/links";
import {
  parseFieldDefinitions,
  parseFieldValues,
  formatFieldValue,
  FIELD_KEYS,
} from "@/lib/fields";
import { NOTE_TYPE, ROUTES } from "@/lib/constants";
import MentionText from "@/components/MentionText";
import Backlinks from "@/components/Backlinks";

export default async function ItemPage({ params }) {
  const user = await requireUser();
  const { id } = await params;

  const item = await findItemForUser(user.id, id);
  if (!item) notFound();

  // Een notitie heeft zijn eigen pagina, met bewerken en verwijderen.
  if (item.type.name === NOTE_TYPE.name) redirect(ROUTES.note(item.id));

  const fields = parseFieldDefinitions(item.type.fieldDefinitions);
  const values = parseFieldValues(item.fieldValues);
  const targets = (await mentionTargets(user.id)).filter((target) => target.id !== item.id);

  return (
    <main className="page">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.type(item.type.id)} className="back-link">
          ← {item.type.name}
        </Link>
        <Link
          href={ROUTES.editItem(item.id)}
          className="btn btn-sm"
        >
          Bewerken
        </Link>
      </div>

      <p className="mt-8 text-sm text-ink-3">
        {item.type.icon ? `${item.type.icon} ` : ""}
        {item.type.name}
      </p>
      <h1 className="mt-1 view-title">{item.title}</h1>

      {fields.length > 0 && (
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 card text-sm">
          {fields.map((field) => (
            <div key={field[FIELD_KEYS.NAME]} className="contents">
              <dt className="text-ink-3">{field[FIELD_KEYS.NAME]}</dt>
              <dd>{formatFieldValue(field, values[field[FIELD_KEYS.NAME]])}</dd>
            </div>
          ))}
        </dl>
      )}

      {item.body && (
        <p className="mt-6 reading">
          <MentionText text={item.body} targets={targets} />
        </p>
      )}

      <Backlinks userId={user.id} item={item} />
    </main>
  );
}