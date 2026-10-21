import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { findTypeForUser } from "@/lib/types";
import { mentionTargets } from "@/lib/links";
import { parseFieldDefinitions } from "@/lib/fields";
import { createItem } from "@/app/item-actions";
import { ROUTES } from "@/lib/constants";
import DynamicItemForm from "@/components/DynamicItemForm";

export default async function NewItemPage({ params }) {
  const user = await requireUser();
  const { id } = await params;

  const type = await findTypeForUser(user.id, id);
  if (!type) notFound();

  // Het formulier hieronder staat niet in de code: het wordt nu opgebouwd uit
  // de velden die de gebruiker voor deze soort bedacht.
  const fields = parseFieldDefinitions(type.fieldDefinitions);
  const targets = await mentionTargets(user.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={ROUTES.type(type.id)} className="text-sm text-ink-3 underline">
        ← {type.name}
      </Link>

      <h1 className="mt-8 text-3xl font-semibold">
        {type.icon ? `${type.icon} ` : ""}
        Nieuw: {type.name}
      </h1>

      <DynamicItemForm action={createItem} type={type} fields={fields} targets={targets} />
    </main>
  );
}