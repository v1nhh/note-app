import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createNote } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { mentionTargets } from "@/lib/links";
import { NOTE_TYPE, ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import NoteForm from "@/components/NoteForm";

// Deze component draait op de server, dus hij mag de database direct lezen.
export default async function HomePage() {
  // Niet ingelogd? Dan stuurt requireUser je naar de inlogpagina.
  const user = await requireUser();

  // Alleen je eigen notities: personen, boeken en andere soorten staan in
  // dezelfde tabel, maar horen niet in deze lijst.
  const [notes, targets] = await Promise.all([
    prisma.item.findMany({
      where: { userId: user.id, type: { name: NOTE_TYPE.name } },
      orderBy: { date: "desc" },
    }),
    mentionTargets(user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Notities</h1>

      <div className="mt-8">
        <NoteForm action={createNote} targets={targets} />
      </div>

      {notes.length === 0 ? (
        <p className="mt-10 text-ink-3">Nog geen notities.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={ROUTES.note(note.id)}
                className="block rounded-md border border-line bg-card p-4 hover:border-ink-3"
              >
                <p className="text-sm text-ink-3">{formatDate(note.date)}</p>
                <h2 className="mt-1 font-semibold">{note.title}</h2>
                {note.body && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-ink-2">
                    {note.body}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}