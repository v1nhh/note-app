"use client";

import { deleteNote } from "@/app/actions";
import { NOTE_FORM } from "@/lib/constants";

/// Verwijderen is niet terug te draaien, dus eerst vragen. Dat vragen gebeurt
/// in de browser, daarom is dit een client component.
export default function DeleteNoteButton({ id }) {
  function confirmDelete(event) {
    const sure = window.confirm(
      "Deze notitie verwijderen? Dit kun je niet ongedaan maken.",
    );
    // preventDefault stopt het versturen: de server action wordt niet
    // aangeroepen.
    if (!sure) event.preventDefault();
  }

  return (
    <form action={deleteNote} onSubmit={confirmDelete}>
      <input type="hidden" name={NOTE_FORM.ID} value={id} />
      <button
        type="submit"
        className="rounded-md border border-danger-line px-4 py-2 text-sm text-danger hover:bg-danger-soft"
      >
        Verwijderen
      </button>
    </form>
  );
}