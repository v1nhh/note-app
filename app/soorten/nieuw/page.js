import Link from "next/link";
import ItemTypeForm from "@/components/ItemTypeForm";
import { createItemType } from "@/app/type-actions";
import { requireUser } from "@/lib/session";
import { ROUTES } from "@/lib/constants";

export const metadata = { title: "Nieuwe soort" };

export default async function NewTypePage() {
  await requireUser();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={ROUTES.TYPES} className="text-sm text-neutral-500 underline">
        ← Soorten
      </Link>

      <h1 className="mt-8 text-3xl font-semibold">Nieuwe soort</h1>
      <p className="mt-2 text-neutral-600">
        Bepaal zelf welke velden deze soort heeft. De app bouwt er het
        invoerformulier van.
      </p>

      <ItemTypeForm action={createItemType} />
    </main>
  );
}