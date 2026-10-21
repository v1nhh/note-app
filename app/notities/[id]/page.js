import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default async function NotePage({ params }) {
  // In Next 16 is params een promise: de waarden uit de URL komen binnen
  // zodra de server ze kent.
  const { id } = await params;

  // De id komt uit de URL en kan van alles zijn: /notities/abc levert NaN op.
  const noteId = Number(id);
  if (!Number.isInteger(noteId)) notFound();

  const note = await prisma.item.findUnique({ where: { id: noteId } });

  // Onbekend of verwijderd? Dan de 404-pagina, geen lege pagina.
  if (!note) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={ROUTES.HOME} className="text-sm text-neutral-500 underline">
        ← Alle notities
      </Link>

      <p className="mt-8 text-sm text-neutral-500">{formatDate(note.date)}</p>
      <h1 className="mt-1 text-3xl font-semibold">{note.title}</h1>

      {note.body ? (
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-neutral-800">
          {note.body}
        </p>
      ) : (
        <p className="mt-6 text-neutral-500">Deze notitie heeft nog geen tekst.</p>
      )}
    </main>
  );
}