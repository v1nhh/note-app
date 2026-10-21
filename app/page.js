import { prisma } from "@/lib/prisma";
import { createNote } from "@/app/actions";
import { NOTE_FORM } from "@/lib/constants";

// Deze component draait op de server, hierdoor mag hij de database direct lezen
export default async function HomePage() {
  const notes = await prisma.item.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Noteboek</h1>

      <form action={createNote} className="mt-8 flex flex-col gap-3">
        <input
          name={NOTE_FORM.TITLE}
          placeholder="Titel"
          required
          className="rounded-md border border-neutral-300 bg-white px-3 py-2"
        />
        <textarea
          name={NOTE_FORM.BODY}
          placeholder="Wat wil je opschrijven?"
          rows={4}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2"
        />
        <button
          type="submit"
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white"
        >
          Bewaren
        </button>
      </form>

      {notes.length === 0 ? (
        <p className="mt-10 text-neutral-500">Nog geen notities.</p>
      ) : (
        <ul className="mt-10 flex flex-col gap-4">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-md border border-neutral-200 bg-white p-4"
            >
              <p className="text-sm text-neutral-500">
                {note.date.toLocaleDateString("nl-NL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <h2 className="mt-1 font-semibold">{note.title}</h2>
              {note.body && (
                <p className="mt-2 whitespace-pre-wrap text-neutral-700">
                  {note.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}