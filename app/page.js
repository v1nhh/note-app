import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createNote } from "@/app/actions";
import { NOTE_TYPE, ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import NoteForm from "@/components/NoteForm";

// Deze component draait op de server, dus hij mag de database direct lezen.
export default async function HomePage() {
  // Alleen notities: straks komen er ook personen, boeken en andere soorten
  // in dezelfde tabel.
  const notes = await prisma.item.findMany({
    where: { type: { name: NOTE_TYPE.name } },
    orderBy: { date: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Noteboek</h1>

      <div className="mt-8">
        <NoteForm action={createNote} />
      </div>

      {notes.length === 0 ? (
        <p className="mt-10 text-neutral-500">Nog geen notities.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={ROUTES.note(note.id)}
                className="block rounded-md border border-neutral-200 bg-white p-4 hover:border-neutral-400"
              >
                <p className="text-sm text-neutral-500">{formatDate(note.date)}</p>
                <h2 className="mt-1 font-semibold">{note.title}</h2>
                {note.body && (
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-neutral-700">
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