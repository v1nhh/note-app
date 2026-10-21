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
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.type(item.type.id)} className="text-sm text-neutral-500 underline">
          ← {item.type.name}
        </Link>
        <Link
          href={ROUTES.editItem(item.id)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-500"
        >
          Bewerken
        </Link>
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        {item.type.icon ? `${item.type.icon} ` : ""}
        {item.type.name}
      </p>
      <h1 className="mt-1 text-3xl font-semibold">{item.title}</h1>

      {fields.length > 0 && (
        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 rounded-md border border-neutral-200 bg-white p-4 text-sm">
          {fields.map((field) => (
            <div key={field[FIELD_KEYS.NAME]} className="contents">
              <dt className="text-neutral-500">{field[FIELD_KEYS.NAME]}</dt>
              <dd>{formatFieldValue(field, values[field[FIELD_KEYS.NAME]])}</dd>
            </div>
          ))}
        </dl>
      )}

      {item.body && (
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-neutral-800">
          <MentionText text={item.body} targets={targets} />
        </p>
      )}

      <Backlinks userId={user.id} item={item} />
    </main>
  );
}