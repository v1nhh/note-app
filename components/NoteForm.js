import { NOTE_FORM } from "@/lib/constants";

/// Eén formulier voor zowel aanmaken als bewerken. Welke server action het
/// aanroept, bepaalt de pagina die dit component gebruikt.
export default function NoteForm({ action, note = null, submitLabel = "Bewaren" }) {
  return (
    <form action={action} className="flex flex-col gap-3">
      {/* Bij bewerken moet de server weten wélke notitie het is. */}
      {note && <input type="hidden" name={NOTE_FORM.ID} value={note.id} />}

      <input
        name={NOTE_FORM.TITLE}
        defaultValue={note?.title ?? ""}
        placeholder="Titel"
        required
        className="rounded-md border border-neutral-300 bg-white px-3 py-2"
      />
      <textarea
        name={NOTE_FORM.BODY}
        defaultValue={note?.body ?? ""}
        placeholder="Wat wil je opschrijven?"
        rows={note ? 12 : 4}
        className="rounded-md border border-neutral-300 bg-white px-3 py-2"
      />
      <button
        type="submit"
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}