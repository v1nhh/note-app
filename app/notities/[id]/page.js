import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findNoteForUser } from "@/lib/notes";
import { splitMentions } from "@/lib/mentions";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default async function NotePage({ params }) {
  const user = await requireUser();

  // In Next 16 is params een promise: de waarden uit de URL komen binnen
  // zodra de server ze kent.
  const { id } = await params;

  // Onbekend, verwijderd of van iemand anders: dan de 404-pagina. Zo verraad
  // je ook niet dat er een notitie met die id bestaat.
  const note = await findNoteForUser(user.id, id);
  if (!note) notFound();

  // De items waar deze notitie naar verwijst: de verbindingen die bij het
  // bewaren uit de tekst zijn gehaald.
  const connections = await prisma.connection.findMany({
    where: { fromItemId: note.id },
    include: {
      toItem: {
        select: { id: true, title: true, type: { select: { name: true, icon: true } } },
      },
    },
  });
  const linked = connections.map((connection) => connection.toItem);

  // Alleen de echte verbindingen markeren in de tekst, geen losse @'s.
  const parts = splitMentions(note.body, linked);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.HOME} className="text-sm text-neutral-500 underline">
          ← Alle notities
        </Link>
        <Link
          href={ROUTES.editNote(note.id)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:border-neutral-500"
        >
          Bewerken
        </Link>
      </div>

      <p className="mt-8 text-sm text-neutral-500">{formatDate(note.date)}</p>
      <h1 className="mt-1 text-3xl font-semibold">{note.title}</h1>

      {note.body ? (
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-neutral-800">
          {parts.map((part, index) =>
            part.target ? (
              <span key={index} className="font-medium text-blue-700">
                {part.text}
              </span>
            ) : (
              part.text
            ),
          )}
        </p>
      ) : (
        <p className="mt-6 text-neutral-500">Deze notitie heeft nog geen tekst.</p>
      )}

      {linked.length > 0 && (
        <section className="mt-12 border-t border-neutral-200 pt-6">
          <h2 className="text-sm font-semibold text-neutral-500">Gekoppeld aan</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {linked.map((item) => (
              <li
                key={item.id}
                className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm"
              >
                {item.type.icon ? `${item.type.icon} ` : ""}
                {item.title}
                <span className="ml-2 text-neutral-500">{item.type.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}