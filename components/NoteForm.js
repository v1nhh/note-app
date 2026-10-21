import { NOTE_FORM } from "@/lib/constants";
import MentionTextarea from "@/components/MentionTextarea";

/// Eén formulier voor zowel aanmaken als bewerken. Welke server action het
/// aanroept, bepaalt de pagina die dit component gebruikt. targets zijn de
/// items waar je met @ naar kunt verwijzen.
export default function NoteForm({ action, note = null, targets = [], submitLabel = "Bewaren" }) {
  return (
    <form action={action} className="flex flex-col gap-3">
      {/* Bij bewerken moet de server weten wélke notitie het is. */}
      {note && <input type="hidden" name={NOTE_FORM.ID} value={note.id} />}

      <input
        name={NOTE_FORM.TITLE}
        defaultValue={note?.title ?? ""}
        placeholder="Titel"
        aria-label="Titel"
        required
        className="rounded-md border border-neutral-300 bg-white px-3 py-2"
      />
      <MentionTextarea
        name={NOTE_FORM.BODY}
        defaultValue={note?.body ?? ""}
        targets={targets}
        excludeId={note?.id ?? null}
        placeholder="Wat wil je opschrijven? Typ @ om naar iemand of iets te verwijzen."
        aria-label="Tekst"
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