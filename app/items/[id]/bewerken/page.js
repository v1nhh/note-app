import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findItemForUser } from "@/lib/items";
import { mentionTargets } from "@/lib/links";
import { parseFieldDefinitions, parseFieldValues } from "@/lib/fields";
import { updateItem } from "@/app/item-actions";
import { NOTE_TYPE, ROUTES } from "@/lib/constants";
import DynamicItemForm from "@/components/DynamicItemForm";
import DeleteItemButton from "@/components/DeleteItemButton";

export default async function EditItemPage({ params }) {
  const user = await requireUser();
  const { id } = await params;

  const item = await findItemForUser(user.id, id);
  if (!item) notFound();

  // Een notitie bewerk je op zijn eigen bewerkpagina.
  if (item.type.name === NOTE_TYPE.name) redirect(ROUTES.editNote(item.id));

  const [targets, mentionedCount] = await Promise.all([
    mentionTargets(user.id),
    prisma.connection.count({ where: { toItemId: item.id } }),
  ]);

  // Hetzelfde zelfbouwende formulier als bij aanmaken, nu ingevuld.
  const fields = parseFieldDefinitions(item.type.fieldDefinitions);
  const values = parseFieldValues(item.fieldValues);

  return (
    <main className="page">
      <Link href={ROUTES.item(item.id)} className="back-link">
        ← {item.title}
      </Link>

      <h1 className="mt-8 view-title">
        {item.type.icon ? `${item.type.icon} ` : ""}
        {item.type.name} bewerken
      </h1>

      {mentionedCount > 0 && (
        <p className="mt-3 text-sm text-ink-2">
          Genoemd in {mentionedCount} {mentionedCount === 1 ? "stuk" : "stukken"}. Geef je
          een nieuwe titel, dan wordt @{item.title} daar ook aangepast.
        </p>
      )}

      <DynamicItemForm
        action={updateItem}
        type={item.type}
        fields={fields}
        item={{ id: item.id, title: item.title, body: item.body, values }}
        targets={targets}
        submitLabel="Wijzigingen bewaren"
      />

      <div className="mt-12 border-t border-line pt-6">
        <DeleteItemButton id={item.id} title={item.title} mentionedCount={mentionedCount} />
      </div>
    </main>
  );
}