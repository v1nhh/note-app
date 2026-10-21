import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { findNoteForUser } from "@/lib/notes";
import { itemHref } from "@/lib/links";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import MentionText from "@/components/MentionText";
import Backlinks from "@/components/Backlinks";

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
  const linked = connections.map(({ toItem }) => ({
    id: toItem.id,
    title: toItem.title,
    typeName: toItem.type.name,
    icon: toItem.type.icon,
  }));

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href={ROUTES.HOME} className="text-sm text-ink-3 underline">
          ← Alle notities
        </Link>
        <Link
          href={ROUTES.editNote(note.id)}
          className="rounded-md border border-line-2 px-3 py-1.5 text-sm hover:border-ink-3"
        >
          Bewerken
        </Link>
      </div>

      <p className="mt-8 text-sm text-ink-3">{formatDate(note.date)}</p>
      <h1 className="mt-1 text-3xl font-semibold">{note.title}</h1>

      {note.body ? (
        <p className="mt-6 whitespace-pre-wrap leading-relaxed text-ink">
          {/* Alleen de echte verbindingen worden links, geen losse @'s. */}
          <MentionText text={note.body} targets={linked} />
        </p>
      ) : (
        <p className="mt-6 text-ink-3">Deze notitie heeft nog geen tekst.</p>
      )}

      {linked.length > 0 && (
        <section className="mt-12 border-t border-line pt-6">
          <h2 className="text-sm font-semibold text-ink-3">Gekoppeld aan</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {linked.map((item) => (
              <li key={item.id}>
                <Link
                  href={itemHref(item.id, item.typeName)}
                  className="block rounded-md border border-line bg-card px-3 py-1.5 text-sm hover:border-ink-3"
                >
                  {item.icon ? `${item.icon} ` : ""}
                  {item.title}
                  <span className="ml-2 text-ink-3">{item.typeName}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ook een notitie kan genoemd worden, door een andere notitie. */}
      <Backlinks userId={user.id} item={note} />
    </main>
  );
}