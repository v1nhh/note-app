import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { findTypeForUser } from "@/lib/types";
import { parseFieldDefinitions } from "@/lib/fields";
import { updateItemType } from "@/app/type-actions";
import { NOTE_TYPE, ROUTES } from "@/lib/constants";
import ItemTypeForm from "@/components/ItemTypeForm";

export const metadata = { title: "Soort aanpassen" };

export default async function EditTypePage({ params }) {
  const user = await requireUser();
  const { id } = await params;

  const type = await findTypeForUser(user.id, id);
  // De soort voor notities heeft geen eigen velden en pas je niet aan.
  if (!type || type.name === NOTE_TYPE.name) notFound();

  const fields = parseFieldDefinitions(type.fieldDefinitions);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={ROUTES.type(type.id)} className="text-sm text-ink-3 underline">
        ← {type.name}
      </Link>

      <h1 className="mt-8 text-3xl font-semibold">Soort aanpassen</h1>

      {/* key: na bewaren komt de pagina met nieuwe velden terug. Een nieuwe
          key laat React het formulier opnieuw opbouwen in plaats van de oude
          rijen te houden. */}
      <ItemTypeForm
        key={type.fieldDefinitions}
        action={updateItemType}
        type={{ id: type.id, name: type.name, icon: type.icon }}
        fields={fields}
      />
    </main>
  );
}