import Link from "next/link";
import { notFound } from "next/navigation";
import { updateNote } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { findNoteForUser } from "@/lib/notes";
import { ROUTES } from "@/lib/constants";
import NoteForm from "@/components/NoteForm";
import DeleteNoteButton from "@/components/DeleteNoteButton";

export default async function EditNotePage({ params }) {
  const user = await requireUser();
  const { id } = await params;

  const note = await findNoteForUser(user.id, id);
  if (!note) notFound();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <Link href={ROUTES.note(note.id)} className="text-sm text-neutral-500 underline">
        ← Terug naar de notitie
      </Link>

      <h1 className="mt-8 text-2xl font-semibold">Notitie bewerken</h1>

      <div className="mt-6">
        <NoteForm action={updateNote} note={note} submitLabel="Wijzigingen bewaren" />
      </div>

      <div className="mt-12 border-t border-neutral-200 pt-6">
        <DeleteNoteButton id={note.id} />
      </div>
    </main>
  );
}